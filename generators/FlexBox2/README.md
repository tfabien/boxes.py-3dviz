# FlexBox2

Box with living hinge and top corners rounded.

Upstream: [`FlexBox2`](https://boxes.hackerspace-bamberg.de/FlexBox2) on the public Boxes.py instance.

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
| `viz.js` | 3D model: defines `BUILD.FlexBox2`, the JavaScript port of the generator's `render()` (panels, openers, flexible wall) |
| `schema.json` / `texts.json` | parameter form: English structure and per-language labels, **extracted** by `tools/extract_schemas.py` (do not edit) |
| `i18n/<lang>.json` | translations of the messages (`warn` / `fail` / `notes`) of this generator |

## Limitations

- Wall end fingers on the vertical edge are not drawn.
- Partial: wall end fingers not drawn.

## Parameters used by the 3D model

`x`, `y`, `h`, `radius`, `latchsize`, `Flex_connection`, `Flex_distance`, `Flex_width`
