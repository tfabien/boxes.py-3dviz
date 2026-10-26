# SlidingDrawer

Sliding drawer box.

Upstream: [`SlidingDrawer`](https://boxes.hackerspace-bamberg.de/SlidingDrawer) on the public Boxes.py instance.

| | |
|---|---|
| Home page section | Boxes |
| Sliders | Explode, Opening |
| Parameters | 33 in the form, 13 influence the 3D model (the others are greyed out) |
| Message translations | fr |

## Files

| File | Content |
|---|---|
| `generator.json` | 3D descriptor (hand written): display `order`, home page `section`, `local` (class run by the local server), `used` (parameters that influence the 3D model), `notes` (limitations shown under the parameter list) |
| `viz.js` | 3D model: defines `BUILD.SlidingDrawer`, the JavaScript port of the generator's `render()` (panels, openers, flexible wall) |
| `schema.json` / `texts.json` | parameter form: English structure and per-language labels, **extracted** by `tools/extract_schemas.py` (do not edit) |
| `i18n/<lang>.json` | translations of the messages (`warn` / `fail` / `notes`) of this generator |

## Limitations

- Tall drawer front placed on the opening side (deduced from the grip groove); drawer centred using the play.

## Parameters used by the 3D model

`x`, `y`, `h`, `hi`, `play`, `Grooved_style`, `Grooved_arc_angle`, `Grooved_tri_angle`, `Grooved_width`, `Grooved_gap`, `Grooved_margin`, `Grooved_inverse`, `Grooved_interleave`
