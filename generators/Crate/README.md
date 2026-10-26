# Crate

Crate with handles. Can be made stackable. Can produce additional mask to put patterns onto crate walls.

Upstream: [`Crate`](https://boxes.hackerspace-bamberg.de/Crate) on the public Boxes.py instance.

| | |
|---|---|
| Home page section | Boxes |
| Sliders | Explode |
| Parameters | 33 in the form, 14 influence the 3D model (the others are greyed out) |
| Message translations | fr |

## Files

| File | Content |
|---|---|
| `generator.json` | 3D descriptor (hand written): display `order`, home page `section`, `local` (class run by the local server), `used` (parameters that influence the 3D model), `notes` (limitations shown under the parameter list) |
| `viz.js` | 3D model: defines `BUILD.Crate`, the JavaScript port of the generator's `render()` (panels, openers, flexible wall) |
| `schema.json` / `texts.json` | parameter form: English structure and per-language labels, **extracted** by `tools/extract_schemas.py` (do not edit) |
| `i18n/<lang>.json` | translations of the messages (`warn` / `fail` / `notes`) of this generator |

## Limitations

- No "outside" parameter (inner dimensions). The s/S feet/recesses are modelled; auxiliary parts (strips, lip, mask) are not drawn.

## Parameters used by the 3D model

`x`, `y`, `h`, `HandleOffset`, `HandleWidth`, `HandleHeight`, `HandleRadius`, `MakeStackable`, `Stackable_angle`, `Stackable_height`, `Stackable_width`, `Stackable_holedistance`, `FingerJoint_edge_width`, `FingerJoint_width`
