# BrickSorter

Stackable nestable sorting sieve for bricks.

Upstream: [`BrickSorter`](https://boxes.hackerspace-bamberg.de/BrickSorter) on the public Boxes.py instance.

| | |
|---|---|
| Home page section | Boxes |
| Sliders | Explode |
| Parameters | 25 in the form, 8 influence the 3D model (the others are greyed out) |
| Message translations | fr |

## Files

| File | Content |
|---|---|
| `generator.json` | 3D descriptor (hand written): display `order`, home page `section`, `local` (class run by the local server), `used` (parameters that influence the 3D model), `notes` (limitations shown under the parameter list) |
| `viz.js` | 3D model: defines `BUILD.BrickSorter`, the JavaScript port of the generator's `render()` (panels, openers, flexible wall) |
| `schema.json` / `texts.json` | parameter form: English structure and per-language labels, **extracted** by `tools/extract_schemas.py` (do not edit) |
| `i18n/<lang>.json` | translations of the messages (`warn` / `fail` / `notes`) of this generator |

## Limitations

- Only one level is shown at a time ("level" setting), as in the generator.

## Parameters used by the 3D model

`x`, `y`, `h`, `level`, `radius`, `wiggle`, `FingerJoint_edge_width`, `FingerJoint_width`
