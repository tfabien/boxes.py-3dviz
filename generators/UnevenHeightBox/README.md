# UnevenHeightBox

Box with different height in each corner.

Upstream: [`UnevenHeightBox`](https://boxes.hackerspace-bamberg.de/UnevenHeightBox) on the public Boxes.py instance.

| | |
|---|---|
| Home page section | Boxes |
| Sliders | Explode |
| Parameters | 38 in the form, 10 influence the 3D model (the others are greyed out) |
| Message translations | none yet (English) |

## Files

| File | Content |
|---|---|
| `generator.json` | 3D descriptor (hand written): display `order`, home page `section`, `local` (class run by the local server), `used` (parameters that influence the 3D model), `notes` (limitations shown under the parameter list) |
| `viz.js` | 3D model: defines `BUILD.UnevenHeightBox`, the JavaScript port of the generator's `render()` (panels, openers, flexible wall) |
| `schema.json` / `texts.json` | parameter form: English structure and per-language labels, **extracted** by `tools/extract_schemas.py` (do not edit) |
| `i18n/<lang>.json` | translations of the messages (`warn` / `fail` / `notes`) of this generator |

## Limitations

- Grooves (edge_types) are ignored.
- Partial: no lid, no grooves.

## Parameters used by the 3D model

`bottom_edge`, `x`, `y`, `height0`, `height1`, `height2`, `height3`, `add_lid`, `FingerJoint_edge_width`, `FingerJoint_width`
