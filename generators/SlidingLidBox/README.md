# SlidingLidBox

Box with rails for a sliding lid.

Upstream: [`SlidingLidBox`](https://boxes.hackerspace-bamberg.de/SlidingLidBox) on the public Boxes.py instance.

| | |
|---|---|
| Home page section | Boxes |
| Sliders | Explode, Opening |
| Parameters | 31 in the form, 13 influence the 3D model (the others are greyed out) |
| Message translations | fr |

## Files

| File | Content |
|---|---|
| `generator.json` | 3D descriptor (hand written): display `order`, home page `section`, `local` (class run by the local server), `used` (parameters that influence the 3D model), `notes` (limitations shown under the parameter list) |
| `viz.js` | 3D model: defines `BUILD.SlidingLidBox`, the JavaScript port of the generator's `render()` (panels, openers, flexible wall) |
| `schema.json` / `texts.json` | parameter form: English structure and per-language labels, **extracted** by `tools/extract_schemas.py` (do not edit) |
| `i18n/<lang>.json` | translations of the messages (`warn` / `fail` / `notes`) of this generator |

## Limitations

- Front/back deduced from the edge composition (sides: "fE" at the front); lid grip opening drawn.

## Parameters used by the 3D model

`x`, `y`, `h`, `bottom_edge`, `rail`, `margin_t`, `margin_s`, `lid_type`, `hole_length`, `hole_width`, `hole_radius`, `FingerJoint_edge_width`, `FingerJoint_width`
