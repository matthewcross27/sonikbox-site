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
  var addonEngineer = document.getElementById("addon-engineer");
  var addonAutotune = document.getElementById("addon-autotune");
  var addonMixdown = document.getElementById("addon-mixdown");
  var summaryBase = document.getElementById("summary-base");
  var summaryTravel = document.getElementById("summary-travel");
  var summaryAddons = document.getElementById("summary-addons");
  var summaryTotal = document.getElementById("summary-total");
  var estimatorSubmit = document.getElementById("estimator-submit");

  var currentHub = "la";

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
      addonsTotal += 100;
      addonLabels.push("Antares Auto-Tune Hybrid Real-time Rig");
    }
    if (addonMixdown.checked) {
      addonsTotal += 250;
      addonLabels.push("Full Stereophonic Mixdown & Reference Master");
    }

    var total = base + travel + addonsTotal;

    summaryBase.textContent = "$" + base.toLocaleString();
    summaryTravel.textContent = "$" + travel.toLocaleString();
    summaryAddons.textContent = "$" + addonsTotal.toLocaleString();
    summaryTotal.textContent = "$" + total.toLocaleString();

    return { hours: hours, base: base, travel: travel, addonsTotal: addonsTotal, addonLabels: addonLabels, total: total };
  }

  hoursRange.addEventListener("input", recalculate);
  radiusSelect.addEventListener("change", recalculate);
  addonEngineer.addEventListener("change", recalculate);
  addonAutotune.addEventListener("change", recalculate);
  addonMixdown.addEventListener("change", recalculate);

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
      "Estimated total: $" + quote.total.toLocaleString(),
      "",
      "Preferred date: ",
      "Project type: "
    ];
    window.location.href = mailtoUrl(subject, bodyLines.join("\n"));
  });

  // ---------------------------------------------------------------------
  // Print Studio Rider
  // ---------------------------------------------------------------------
  var printBtn = document.getElementById("print-rider-btn");
  printBtn.addEventListener("click", function () {
    window.print();
  });
})();
