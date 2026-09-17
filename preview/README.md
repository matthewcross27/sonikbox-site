# Direction preview (temporary)

Three visual directions for the captain to flip between at one local address.
Everything that makes this work lives in this directory.

## Run it

From the repository root:

    python3 -m http.server 8777

Then open <http://127.0.0.1:8777/preview/>.

Press `0`-`4`, or click the buttons, to switch. The address carries the choice
(`#signal`, `#1u`, `#rider`, `#rider-black`), so a direction can be reloaded or
shared as a link.

## How it stays out of the site's way

`preview/index.html` frames the real `index.html` in a same-origin iframe and
appends one stylesheet to the framed document. The site's own files are never
read from or written to, and `/index.html` on its own is exactly what ships.

## The three directions

| Key | Name | Colour strategy | The bet |
|---|---|---|---|
| `#signal` | A / Signal | Drenched | Orange is a ground, not an accent. The page alternates black and orange folds; inside an orange fold every brand role inverts, so the accent there is black. |
| `#1u` | B / 1U | Restrained | Orange drops under 5% and is spent only as indicators: LEDs, meters, the committing button. Everything else is machined metal, on rails, cut to a rack unit. |
| `#rider` | C / Rider | Committed, inverted ground | The printed studio rider, promoted to the screen. Card stock, black ink, orange as fill only, never as type. |
| `#rider-black` | D / Rider on black | Committed, on the default ground | C's character on the black base, keeping C's solid orange blocks. The captain's pick, built after they chose C's feel but the default's colour scheme. |

D is the one that was asked for rather than proposed. C's character was never the
paper; it was three rules, and all three survive the change of ground:

1. **Orange is fill, never type.** It stops being decoration sprinkled over
   labels and becomes structure: module plates, the headline block, the selected
   states, the stamped total, the closing plate.
2. **One labelling system.** Spec labels, form labels, summary lines and card
   labels are all set the same way, so the page reads as one record.
3. **Flush left, ruled, generous.** Longer leading, a shorter measure, and a
   closing block that is aligned rather than centred.

All four keep Archivo Black, IBM Plex Mono, `border-radius: 0`, and orange and
black. None adds a dependency, a font service, or a build step. All four were
checked for WCAG AA contrast and for overflow at 390, 820, 1024 and 1440, with a
clean console.

## Removing it

    rm -rf preview/

Nothing else refers to this directory. Do that before the branch ships: the site
is published from the repository root, so a merged `preview/` would be live at
`/preview/` (it carries `noindex`, but it would still be reachable).
