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

  function navIsOpen() {
    return navPanel.classList.contains("is-open");
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
    if (event.key === "Escape" && navIsOpen()) {
      closeNav();
      navToggle.focus();
    }
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth >= 768 && navIsOpen()) {
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
      { value: "0", fee: 0, label: "Metro LA & Hollywood - Within 15 mi (Free)" },
      { value: "150", fee: 150, label: "Greater LA County / Valley - 15–40 mi (+$150 Travel Fee)" },
      { value: "300", fee: 300, label: "Out-of-Bounds - Malibu, Desert, Ventura (+$300 Travel Fee)" }
    ],
    sd: [
      { value: "0", fee: 0, label: "Downtown, Gaslamp & Mission Valley - Within 15 mi (Free)" },
      { value: "150", fee: 150, label: "North County / Oceanside / East County - 15–40 mi (+$150 Travel Fee)" },
      { value: "300", fee: 300, label: "Extended Tracks - Temecula, Imperial Valley (+$300 Travel Fee)" }
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
      text.appendChild(document.createTextNode(" - " + addon.priceCopy));

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

  function updateRangeFill() {
    var min = Number(hoursRange.min);
    var max = Number(hoursRange.max);
    var pct = max > min ? ((Number(hoursRange.value) - min) / (max - min)) * 100 : 0;
    hoursRange.style.setProperty("--range-fill", pct + "%");
  }

  function recalculate() {
    var hours = parseInt(hoursRange.value, 10);
    hoursValue.textContent = hours + " hrs";
    updateRangeFill();

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
    var subject = "Session Request";
    var bodyLines = [
      "Hub: " + currentHubLabel(),
      "Tracking hours: " + quote.hours + " hrs",
      "Distance from hub: " + currentRadiusLabel(),
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

  // ---------------------------------------------------------------------
  // Scroll reveal — a handful of section-level entrances (never per-card),
  // gated on both feature support and prefers-reduced-motion. css/styles.css
  // only ever hides a .reveal element once <html> carries .js-reveal, so a
  // browser that lands in neither branch below leaves every .reveal element
  // fully visible instead of stuck invisible.
  // ---------------------------------------------------------------------
  var prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!prefersReducedMotion && "IntersectionObserver" in window) {
    document.documentElement.classList.add("js-reveal");

    var revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: "0px 0px -10% 0px" }
    );

    document.querySelectorAll(".reveal").forEach(function (target) {
      revealObserver.observe(target);
    });
  }

  // ---------------------------------------------------------------------
  // Hero photo tilt — the one "alive" signature. Fine-pointer, hover-capable
  // devices only, and skipped outright under reduced motion.
  // ---------------------------------------------------------------------
  var heroPhotoFrame = document.querySelector(".hero-photo-frame");
  var canHoverFine = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (heroPhotoFrame && !prefersReducedMotion && canHoverFine) {
    var MAX_TILT_DEG = 6;

    function setTilt(rotateXDeg, rotateYDeg) {
      // Written straight to transform (not a custom property) so this
      // recalculates only heroPhotoFrame itself, not a subtree.
      heroPhotoFrame.style.transform =
        "perspective(900px) rotateX(" + rotateXDeg + "deg) rotateY(" + rotateYDeg + "deg)";
    }

    heroPhotoFrame.addEventListener("mousemove", function (event) {
      var rect = heroPhotoFrame.getBoundingClientRect();
      var px = (event.clientX - rect.left) / rect.width - 0.5;
      var py = (event.clientY - rect.top) / rect.height - 0.5;
      setTilt(py * -MAX_TILT_DEG * 2, px * MAX_TILT_DEG * 2);
    });

    heroPhotoFrame.addEventListener("mouseleave", function () {
      setTilt(0, 0);
    });
  }

  // ---------------------------------------------------------------------
  // EXPERIMENTAL: Console Scroll rail — off by default, never touches the
  // page above unless the captain switches it on. State lives only in
  // localStorage so a reload during review keeps it on. To remove this
  // idea entirely: delete this block, the matching CSS section, and the
  // two elements at the end of index.html's <body>.
  // ---------------------------------------------------------------------
  var experimentalToggle = document.getElementById("experimental-toggle");
  var consoleRailIndicator = document.getElementById("console-rail-indicator");
  var consoleRailTrack = document.querySelector(".console-rail-track");
  var CONSOLE_RAIL_STORAGE_KEY = "sonikbox-experimental-console-rail";
  var consoleRailScrollHandler = null;
  var consoleRailResizeHandler = null;

  function updateConsoleRailIndicator() {
    var trackHeight = consoleRailTrack.clientHeight;
    var travelRange = Math.max(trackHeight - consoleRailIndicator.clientHeight, 0);
    var scrollable = document.documentElement.scrollHeight - window.innerHeight;
    var progress = scrollable > 0 ? window.scrollY / scrollable : 0;
    progress = Math.min(Math.max(progress, 0), 1);
    consoleRailIndicator.style.transform = "translateY(" + (progress * travelRange) + "px)";
  }

  function enableConsoleRail() {
    document.documentElement.classList.add("console-rail-on");
    experimentalToggle.setAttribute("aria-pressed", "true");
    updateConsoleRailIndicator();
    consoleRailScrollHandler = updateConsoleRailIndicator;
    consoleRailResizeHandler = updateConsoleRailIndicator;
    window.addEventListener("scroll", consoleRailScrollHandler, { passive: true });
    window.addEventListener("resize", consoleRailResizeHandler);
  }

  function disableConsoleRail() {
    document.documentElement.classList.remove("console-rail-on");
    experimentalToggle.setAttribute("aria-pressed", "false");
    if (consoleRailScrollHandler) {
      window.removeEventListener("scroll", consoleRailScrollHandler);
      window.removeEventListener("resize", consoleRailResizeHandler);
      consoleRailScrollHandler = null;
      consoleRailResizeHandler = null;
    }
  }

  if (experimentalToggle && consoleRailIndicator && consoleRailTrack) {
    var storedPreference = null;
    try {
      storedPreference = window.localStorage.getItem(CONSOLE_RAIL_STORAGE_KEY);
    } catch (e) {
      storedPreference = null;
    }

    if (storedPreference === "on") {
      enableConsoleRail();
    }

    experimentalToggle.addEventListener("click", function () {
      var turningOn = experimentalToggle.getAttribute("aria-pressed") !== "true";
      if (turningOn) {
        enableConsoleRail();
      } else {
        disableConsoleRail();
      }
      try {
        window.localStorage.setItem(CONSOLE_RAIL_STORAGE_KEY, turningOn ? "on" : "off");
      } catch (e) {
        // Best-effort only; the toggle still works for this page view.
      }
    });
  }
})();
