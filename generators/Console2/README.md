# Console2

Console with slanted panel and service hatches.

Upstream: [`Console2`](https://boxes.hackerspace-bamberg.de/Console2) on the public Boxes.py instance.

| | |
|---|---|
| Home page section | Boxes |
| Sliders | Explode, Opening |
| Parameters | 34 in the form, 16 influence the 3D model (the others are greyed out) |
| Message translations | fr |

## Files

| File | Content |
|---|---|
| `generator.json` | 3D descriptor (hand written): display `order`, home page `section`, `local` (class run by the local server), `used` (parameters that influence the 3D model), `notes` (limitations shown under the parameter list) |
| `viz.js` | 3D model: defines `BUILD.Console2`, the JavaScript port of the generator's `render()` (panels, openers, flexible wall) |
| `schema.json` / `texts.json` | parameter form: English structure and per-language labels, **extracted** by `tools/extract_schemas.py` (do not edit) |
| `i18n/<lang>.json` | translations of the messages (`warn` / `fail` / `notes`) of this generator |

## Limitations

- Opening: back wall removed towards the bottom, panel lifted (movements deduced from the instructions). Hardware (latches, guides, clips, crossbars, panel lips) and latch holes of the back wall not drawn; orientation of the parts deduced from the edges.
- Partial: no hardware.

## Parameters used by the 3D model

`x`, `y`, `h`, `bottom_edge`, `outside`, `front_height`, `angle`, `removable_backwall`, `removable_panel`, `glued_panel`, `FingerJoint_edge_width`, `FingerJoint_width`, `Stackable_angle`, `Stackable_height`, `Stackable_holedistance`, `Stackable_width`
