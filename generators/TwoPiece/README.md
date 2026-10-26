# TwoPiece

A two piece box where top slips over the bottom half to form the enclosure.

Upstream: [`TwoPiece`](https://boxes.hackerspace-bamberg.de/TwoPiece) on the public Boxes.py instance.

| | |
|---|---|
| Home page section | Boxes |
| Sliders | Explode, Opening |
| Parameters | 25 in the form, 8 influence the 3D model (the others are greyed out) |
| Message translations | fr |

## Files

| File | Content |
|---|---|
| `generator.json` | 3D descriptor (hand written): display `order`, home page `section`, `local` (class run by the local server), `used` (parameters that influence the 3D model), `notes` (limitations shown under the parameter list) |
| `viz.js` | 3D model: defines `BUILD.TwoPiece`, the JavaScript port of the generator's `render()` (panels, openers, flexible wall) |
| `schema.json` / `texts.json` | parameter form: English structure and per-language labels, **extracted** by `tools/extract_schemas.py` (do not edit) |
| `i18n/<lang>.json` | translations of the messages (`warn` / `fail` / `notes`) of this generator |

## Limitations

- Closed box shown; both shells have walls with the same finger lengths as the generator ("f" setting: edge_width + play).

## Parameters used by the 3D model

`x`, `y`, `h`, `hi`, `outside`, `play`, `FingerJoint_edge_width`, `FingerJoint_width`
