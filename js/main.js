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

  // Single source of truth for add-ons. Price is declared once here and is read
  // by the checkbox copy, the Module 05 spec card, the running total, and the
  // booking email, so the page can never quote one number and charge another.
  // billing "hourly" multiplies by tracking hours; "flat" is charged once.
  var ADDONS = [
    { id: "addon-engineer", name: "Grammy-vetted Tracking Engineer", price: 80, billing: "hourly", unit: "/hr" },
    { id: "addon-autotune", name: "Antares Auto-Tune Hybrid Real-time Rig", price: 100, billing: "flat", unit: " flat" },
    { id: "addon-mixdown", name: "Full Stereophonic Mixdown & Reference Master", price: 250, billing: "flat", unit: " / track" },
    { id: "addon-dj-cdj", name: "Pioneer DJ CDJ-3000 (x2) & Pioneer DJ DJM-A9 Mixer", price: 150, billing: "flat", unit: " flat" },
    { id: "addon-dj-xdj", name: "Pioneer DJ XDJ-RX3", price: 100, billing: "flat", unit: " flat" }
  ];

  function money(amount) {
    return "$" + amount.toLocaleString();
  }

  function addonPriceCopy(addon) {
    return "+" + money(addon.price) + addon.unit;
  }

  function addonAmount(addon, hours) {
    return addon.billing === "hourly" ? addon.price * hours : addon.price;
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
  var summaryBase = document.getElementById("summary-base");
  var summaryTravel = document.getElementById("summary-travel");
  var summaryAddons = document.getElementById("summary-addons");
  var summaryTotal = document.getElementById("summary-total");
  var estimatorSubmit = document.getElementById("estimator-submit");
  var mobileTotalValue = document.getElementById("mobile-total-value");

  var currentHub = "la";

  // Render the add-on checkboxes and every price label from ADDONS.
  function renderAddons() {
    ADDONS.forEach(function (addon) {
      var label = document.createElement("label");
      label.className = "addon-option";

      var input = document.createElement("input");
      input.type = "checkbox";
      input.id = addon.id;
      input.value = String(addon.price);
      input.addEventListener("change", recalculate);

      var text = document.createElement("span");
      var name = document.createElement("span");
      name.className = "addon-name";
      name.textContent = addon.name;
      text.appendChild(name);
      text.appendChild(document.createTextNode(" - " + addonPriceCopy(addon)));

      label.appendChild(input);
      label.appendChild(text);
      addonsContainer.appendChild(label);
      addon.input = input;
    });

    // Prices quoted on the Module 05 spec card come from the same table.
    ADDONS.forEach(function (addon) {
      var slot = document.querySelector('[data-addon-price="' + addon.id + '"]');
      if (slot) {
        slot.textContent = addonPriceCopy(addon);
      }
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
    ADDONS.forEach(function (addon) {
      if (addon.input && addon.input.checked) {
        addonsTotal += addonAmount(addon, hours);
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
