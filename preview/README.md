# Direction preview (temporary)

Three visual directions for the captain to flip between at one local address.
Everything that makes this work lives in this directory.

## Run it

From the repository root:

    python3 -m http.server 8777

Then open <http://127.0.0.1:8777/preview/>.

Press `0`-`3`, or click the buttons, to switch. The address carries the choice
(`#signal`, `#1u`, `#rider`), so a direction can be reloaded or shared as a link.

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

All three keep Archivo Black, IBM Plex Mono, `border-radius: 0`, and orange and
black. None adds a dependency, a font service, or a build step. All three were
checked for WCAG AA contrast and for overflow at 390, 820, 1024 and 1440.

## Removing it

    rm -rf preview/

Nothing else refers to this directory. Do that before the branch ships: the site
is published from the repository root, so a merged `preview/` would be live at
`/preview/` (it carries `noindex`, but it would still be reachable).
