# FlexBox

Box with living hinge and round corners.

Upstream: [`FlexBox`](https://boxes.hackerspace-bamberg.de/FlexBox) on the public Boxes.py instance.

| | |
|---|---|
| Home page section | Boxes with a flexible hinge |
| Sliders | Explode, Unfold |
| Parameters | 29 in the form, 8 influence the 3D model (the others are greyed out) |
| Message translations | none yet (English) |

## Files

| File | Content |
|---|---|
| `generator.json` | 3D descriptor (hand written): display `order`, home page `section`, `local` (class run by the local server), `used` (parameters that influence the 3D model), `notes` (limitations shown under the parameter list) |
| `viz.js` | 3D model: defines `BUILD.FlexBox`, the JavaScript port of the generator's `render()` (panels, openers, flexible wall) |
| `schema.json` / `texts.json` | parameter form: English structure and per-language labels, **extracted** by `tools/extract_schemas.py` (do not edit) |
| `i18n/<lang>.json` | translations of the messages (`warn` / `fail` / `notes`) of this generator |

## Limitations

- Single section (first value of sx); no dividers.
- Partial: first section only, no dividers.

## Parameters used by the 3D model

`sx`, `y`, `h`, `radius`, `latchsize`, `Flex_connection`, `Flex_distance`, `Flex_width`
