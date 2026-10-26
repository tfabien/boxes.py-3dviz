# SideHingeBox

Box, with an hinge that does not protrude from the back of the box, and a latch.

Upstream: [`SideHingeBox`](https://boxes.hackerspace-bamberg.de/SideHingeBox) on the public Boxes.py instance.

| | |
|---|---|
| Home page section | Boxes |
| Sliders | Explode, Opening |
| Parameters | 27 in the form, 8 influence the 3D model (the others are greyed out) |
| Message translations | fr |

## Files

| File | Content |
|---|---|
| `generator.json` | 3D descriptor (hand written): display `order`, home page `section`, `local` (class run by the local server), `used` (parameters that influence the 3D model), `notes` (limitations shown under the parameter list) |
| `viz.js` | 3D model: defines `BUILD.SideHingeBox`, the JavaScript port of the generator's `render()` (panels, openers, flexible wall) |
| `schema.json` / `texts.json` | parameter form: English structure and per-language labels, **extracted** by `tools/extract_schemas.py` (do not edit) |
| `i18n/<lang>.json` | translations of the messages (`warn` / `fail` / `notes`) of this generator |

## Limitations

- Hinged side outlines and hinge holes are faithful; Cherry MX latches are not drawn.
- Partial: no latches.

## Parameters used by the 3D model

`x`, `y`, `h`, `play`, `hinge_center`, `hinge_radius`, `FingerJoint_edge_width`, `FingerJoint_width`
