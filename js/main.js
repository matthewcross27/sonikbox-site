(function () {
  "use strict";

  var BOOK_EMAIL = "book@sonikbox.studio";

  function mailtoUrl(subject, body) {
    return "mailto:" + BOOK_EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  }

  // ---------------------------------------------------------------------
  // Mobile nav toggle
  // ---------------------------------------------------------------------
  var navToggle = document.getElementById("nav-toggle");
  var navPanel = document.getElementById("nav-panel");

  function closeNav() {
    navPanel.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  }

  navToggle.addEventListener("click", function () {
    var isOpen = navPanel.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navPanel.addEventListener("click", function (event) {
    if (event.target.tagName === "A") {
      closeNav();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeNav();
    }
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth >= 768) {
      closeNav();
    }
  });

  // ---------------------------------------------------------------------
  // Simple mailto CTAs (nav button, hero button, CTA band button)
  // ---------------------------------------------------------------------
  var GENERAL_SUBJECT = "Session Inquiry";
  var GENERAL_BODY = "Hub (LA or SD): \nPreferred date: \nProject type: \n";
  var generalMailto = mailtoUrl(GENERAL_SUBJECT, GENERAL_BODY);

  ["nav-book-btn", "hero-book-btn", "cta-book-btn"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) {
      el.setAttribute("href", generalMailto);
    }
  });

  // ---------------------------------------------------------------------
  // Session Rate Builder
  // ---------------------------------------------------------------------
  var HOURLY_RATE = 150;
  var ENGINEER_RATE_PER_HOUR = 80;
  var AUTOTUNE_FLAT = 100;
  var MIXDOWN_FLAT = 250;

  // The Module 05 spec card declares the DJ add-ons: the gear name on the row,
  // the visible price and its amount on the price slot. Read all three back
  // here so the estimator can never name or charge something the card does not
  // list; a row that has gone missing or lost a part of that declaration drops
  // out rather than being offered wrongly.
  var ADDONS = [
    { id: "addon-dj-cdj" },
    { id: "addon-dj-xdj" }
  ].filter(function (addon) {
    var slot = document.querySelector('[data-addon-price="' + addon.id + '"]');
    if (!slot) {
      return false;
    }
    addon.price = Number(slot.getAttribute("data-addon-amount"));
    addon.priceCopy = slot.textContent.trim();
    addon.name = slot.parentNode.textContent.replace(slot.textContent, "").trim();
    return isFinite(addon.price) && addon.price > 0 && addon.priceCopy !== "" && addon.name !== "";
  });

  function money(amount) {
    return "$" + amount.toLocaleString();
  }

  var RADIUS_OPTIONS = {
    la: [
      { value: "0", fee: 0, label: "Metro LA & Hollywood — Within 15 mi (Free)" },
      { value: "150", fee: 150, label: "Greater LA County / Valley — 15–40 mi (+$150 Travel Fee)" },
      { value: "300", fee: 300, label: "Out-of-Bounds — Malibu, Desert, Ventura (+$300 Travel Fee)" }
    ],
    sd: [
      { value: "0", fee: 0, label: "Downtown, Gaslamp & Mission Valley — Within 15 mi (Free)" },
      { value: "150", fee: 150, label: "North County / Oceanside / East County — 15–40 mi (+$150 Travel Fee)" },
      { value: "300", fee: 300, label: "Extended Tracks — Temecula, Imperial Valley (+$300 Travel Fee)" }
    ]
  };

  var hubLaBtn = document.getElementById("hub-la");
  var hubSdBtn = document.getElementById("hub-sd");
  var hoursRange = document.getElementById("hours-range");
  var hoursValue = document.getElementById("hours-value");
  var radiusSelect = document.getElementById("radius-select");
  var addonsContainer = document.getElementById("addons");
  var addonEngineer = document.getElementById("addon-engineer");
  var addonAutotune = document.getElementById("addon-autotune");
  var addonMixdown = document.getElementById("addon-mixdown");
  var summaryBase = document.getElementById("summary-base");
  var summaryTravel = document.getElementById("summary-travel");
  var summaryAddons = document.getElementById("summary-addons");
  var summaryTotal = document.getElementById("summary-total");
  var estimatorSubmit = document.getElementById("estimator-submit");
  var mobileTotalValue = document.getElementById("mobile-total-value");

  var currentHub = "la";

  // Append the DJ add-on checkboxes after the statically listed options.
  function renderAddons() {
    ADDONS.forEach(function (addon) {
      var label = document.createElement("label");
      label.className = "addon-option";

      var input = document.createElement("input");
      input.type = "checkbox";
      input.id = addon.id;
      input.addEventListener("change", recalculate);

      var text = document.createElement("span");
      var name = document.createElement("span");
      name.className = "addon-name";
      name.textContent = addon.name;
      text.appendChild(name);
      text.appendChild(document.createTextNode(" — " + addon.priceCopy));

      label.appendChild(input);
      label.appendChild(text);
      addonsContainer.appendChild(label);
      addon.input = input;
    });
  }

  function populateRadiusOptions() {
    var previousIndex = radiusSelect.selectedIndex >= 0 ? radiusSelect.selectedIndex : 0;
    radiusSelect.innerHTML = "";
    RADIUS_OPTIONS[currentHub].forEach(function (opt) {
      var option = document.createElement("option");
      option.value = opt.value;
      option.textContent = opt.label;
      radiusSelect.appendChild(option);
    });
    radiusSelect.selectedIndex = previousIndex;
  }

  function setHub(hub) {
    currentHub = hub;
    hubLaBtn.setAttribute("aria-pressed", String(hub === "la"));
    hubSdBtn.setAttribute("aria-pressed", String(hub === "sd"));
    populateRadiusOptions();
    recalculate();
  }

  hubLaBtn.addEventListener("click", function () { setHub("la"); });
  hubSdBtn.addEventListener("click", function () { setHub("sd"); });

  function currentHubLabel() {
    return currentHub === "la" ? "Los Angeles Hub" : "San Diego Hub";
  }

  function currentRadiusFee() {
    var opt = RADIUS_OPTIONS[currentHub][radiusSelect.selectedIndex] || RADIUS_OPTIONS[currentHub][0];
    return opt.fee;
  }

  function currentRadiusLabel() {
    var opt = RADIUS_OPTIONS[currentHub][radiusSelect.selectedIndex] || RADIUS_OPTIONS[currentHub][0];
    return opt.label;
  }

  function recalculate() {
    var hours = parseInt(hoursRange.value, 10);
    hoursValue.textContent = hours + " hrs";

    var base = hours * HOURLY_RATE;
    var travel = currentRadiusFee();

    var addonsTotal = 0;
    var addonLabels = [];
    if (addonEngineer.checked) {
      addonsTotal += hours * ENGINEER_RATE_PER_HOUR;
      addonLabels.push("Grammy-vetted Tracking Engineer");
    }
    if (addonAutotune.checked) {
      addonsTotal += AUTOTUNE_FLAT;
      addonLabels.push("Antares Auto-Tune Hybrid Real-time Rig");
    }
    if (addonMixdown.checked) {
      addonsTotal += MIXDOWN_FLAT;
      addonLabels.push("Full Stereophonic Mixdown & Reference Master");
    }
    ADDONS.forEach(function (addon) {
      if (addon.input && addon.input.checked) {
        addonsTotal += addon.price;
        addonLabels.push(addon.name);
      }
    });

    var total = base + travel + addonsTotal;

    summaryBase.textContent = money(base);
    summaryTravel.textContent = money(travel);
    summaryAddons.textContent = money(addonsTotal);
    summaryTotal.textContent = money(total);
    if (mobileTotalValue) {
      mobileTotalValue.textContent = money(total);
    }

    return { hours: hours, base: base, travel: travel, addonsTotal: addonsTotal, addonLabels: addonLabels, total: total };
  }

  hoursRange.addEventListener("input", recalculate);
  radiusSelect.addEventListener("change", recalculate);
  addonEngineer.addEventListener("change", recalculate);
  addonAutotune.addEventListener("change", recalculate);
  addonMixdown.addEventListener("change", recalculate);

  renderAddons();
  populateRadiusOptions();
  recalculate();

  estimatorSubmit.addEventListener("click", function () {
    var quote = recalculate();
    var subject = "Session Inquiry — Studio Lockout Request";
    var bodyLines = [
      "Hub: " + currentHubLabel(),
      "Tracking hours: " + quote.hours + " hrs",
      "Location radius: " + currentRadiusLabel(),
      "Add-ons: " + (quote.addonLabels.length ? quote.addonLabels.join(", ") : "None"),
      "Estimated total: " + money(quote.total),
      "",
      "Preferred date: ",
      "Project type: "
    ];
    window.location.href = mailtoUrl(subject, bodyLines.join("\n"));
  });

  // ---------------------------------------------------------------------
  // Mobile sticky mini-total bar (shows while the estimator is in view;
  // hidden above the 1024px breakpoint via CSS regardless of this state)
  // ---------------------------------------------------------------------
  var mobileTotalBar = document.getElementById("mobile-total-bar");
  var estimatorPanel = document.querySelector("#estimator .estimator-panel");

  if (mobileTotalBar && estimatorPanel && "IntersectionObserver" in window) {
    var estimatorObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        mobileTotalBar.classList.toggle("is-visible", entry.isIntersecting);
      });
    });
    estimatorObserver.observe(estimatorPanel);
  }

  // ---------------------------------------------------------------------
  // Print Studio Rider
  // ---------------------------------------------------------------------
  var printBtn = document.getElementById("print-rider-btn");
  printBtn.addEventListener("click", function () {
    window.print();
  });
})();
