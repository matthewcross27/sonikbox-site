# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- Static site, no build step: `index.html` + `css/styles.css` + `js/main.js`, no bundler/npm dependency. Open `index.html` directly or serve the directory; there is nothing to `npm install` or compile.
- Visual system is "Rack Panel": brand tokens (`#ff5500` orange / `#08080a` bg / `#111115` panels), `border-radius: 0` everywhere, Archivo Black for headlines, IBM Plex Mono for labels/specs (both Google Fonts, linked in `index.html`'s `<head>`). Keep new UI consistent with the `.rack-panel` (screw-corner), `.led`, and `.vu-meter` utility classes in `css/styles.css` rather than inventing new decoration.
- The four gear-spec cards (`#specs`) contain real, verbatim equipment names/models — do not alter the spec content itself when touching that section, only framing/copy around it.
- `book@sonikbox.studio` (used by every CTA's `mailto:` link, wired in `js/main.js`) is a placeholder inbox, not a live booking system. A future task may need to swap this for a real backend/form.
- The `#specs` "Print Studio Rider" button (`js/main.js` `#print-rider-btn`) relies on the `@media print` rules at the bottom of `css/styles.css`, which hide everything except `#specs` and re-theme it black-on-white. If you restructure `#specs`, update those print rules too.
- `assets/img/control-room.jpg` and `assets/img/lounge.jpg` are the two real studio photos (downloaded from the live site, not placeholders) — reused for hero/hub imagery and as the Open Graph/Twitter preview image.
- No real logo asset exists; the "SONIKBOX" wordmark is styled text (`.logo` in `css/styles.css`), not an image/SVG mark.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
