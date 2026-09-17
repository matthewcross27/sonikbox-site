# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- Static site, no build step: `index.html` + `css/styles.css` + `js/main.js`, no bundler/npm dependency. Open `index.html` directly or serve the directory; there is nothing to `npm install` or compile.
- Visual system is "Rack Panel": brand tokens (`#ff5500` orange / `#08080a` bg / `#111115` panels), `border-radius: 0` everywhere, Archivo Black for headlines, IBM Plex Mono for labels/specs (both Google Fonts, linked in `index.html`'s `<head>`). Keep new UI consistent with the `.rack-panel` (screw-corner), `.led`, and `.vu-meter` utility classes in `css/styles.css` rather than inventing new decoration.
- `css/styles.css`'s `:root` holds the whole design system: colour, `--space-*`, `--fs-*`, and `--tap`. Size and space new UI from those tokens; a raw px value in a rule is drift, not a choice. `.rack-panel` draws its screw heads as four background gradients, so anything that sets the `background` *shorthand* on a panel silently wipes `background-size` and blows them up to full-box washes - set `background-color` instead. Panel content also has to clear the first and last 17px of the box or it sits on a screw.
- `body` takes its colour from `var(--text-dim)`, which resolves once on `body`; descendants inherit the resulting colour, not the variable. Redefining a colour token on a subtree therefore does nothing to inherited text unless that subtree also re-declares `color`. This bites any themed or inverted section.
- The gear-spec rows in `#specs` are captain-maintained: correct them to real equipment only on the captain's explicit instruction, and never invent, embellish, or guess a model, generation, or capability claim. Several legacy rows still describe gear the studio may not have; the captain corrects them incrementally, so raise a suspect row as a question rather than editing it unasked.
- `book@sonikbox.studio` is a placeholder inbox, not a live booking system. It's wired into the nav/hero/CTA-band buttons via `mailtoUrl()` in `js/main.js`, and separately hardcoded as a static `mailto:` href in each `.cta-address` fallback text link (hero, CTA band, footer) - update both if the address ever changes. A future task may need to swap this for a real backend/form.
- The `#specs` "Print Studio Rider" button (`js/main.js` `#print-rider-btn`) relies on the `@media print` rules at the bottom of `css/styles.css`, which hide everything except `#specs` and re-theme it black-on-white. The printed rider is its own document: it opens with the `.print-only` title block, hides the on-screen `.section-head-row`, and drops the module grid to one column with a wider label track. If you restructure `#specs`, update those print rules too, and re-check that Module 05's add-on prices still print.
- `assets/img/control-room.jpg` and `assets/img/lounge.jpg` are the two real studio photos (downloaded from the live site, not placeholders) — reused for hero/hub imagery and as the Open Graph/Twitter preview image.
- No real logo asset exists; the "SONIKBOX" wordmark is styled text (`.logo` in `css/styles.css`), not an image/SVG mark.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.

## Temporary directories

- `preview/` is a throwaway direction preview, not part of the site. It frames `index.html` in an iframe and layers one stylesheet over it; nothing outside that directory refers to it. `rm -rf preview/` removes all of it, and that has to happen before the branch ships, because the site is published from the repository root. See `preview/README.md`.
