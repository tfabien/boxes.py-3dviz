# SideDoorHousing

Box with service hatches on either one or both of the sides that are locked with latches.

Upstream: [`SideDoorHousing`](https://boxes.hackerspace-bamberg.de/SideDoorHousing) on the public Boxes.py instance.

| | |
|---|---|
| Home page section | Boxes |
| Sliders | Explode |
| Parameters | 29 in the form, 11 influence the 3D model (the others are greyed out) |
| Message translations | fr |

## Files

| File | Content |
|---|---|
| `generator.json` | 3D descriptor (hand written): display `order`, home page `section`, `local` (class run by the local server), `used` (parameters that influence the 3D model), `notes` (limitations shown under the parameter list) |
| `viz.js` | 3D model: defines `BUILD.SideDoorHousing`, the JavaScript port of the generator's `render()` (panels, openers, flexible wall) |
| `schema.json` / `texts.json` | parameter form: English structure and per-language labels, **extracted** by `tools/extract_schemas.py` (do not edit) |
| `i18n/<lang>.json` | translations of the messages (`warn` / `fail` / `notes`) of this generator |

## Limitations

- Latches, clamps and springs not drawn; doors shown closed (inner edge at z = t).
- Partial: no latches.

## Parameters used by the 3D model

`x`, `y`, `h`, `bottom_edge`, `double_door`, `Stackable_angle`, `Stackable_height`, `Stackable_holedistance`, `Stackable_width`, `FingerJoint_edge_width`, `FingerJoint_width`
