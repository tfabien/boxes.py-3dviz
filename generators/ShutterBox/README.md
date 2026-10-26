# ShutterBox

Box with a rolling shutter made of flex.

Upstream: [`ShutterBox`](https://boxes.hackerspace-bamberg.de/ShutterBox) on the public Boxes.py instance.

| | |
|---|---|
| Home page section | Boxes with a flexible hinge |
| Sliders | Explode |
| Parameters | 28 in the form, 9 influence the 3D model (the others are greyed out) |
| Message translations | fr |

## Files

| File | Content |
|---|---|
| `generator.json` | 3D descriptor (hand written): display `order`, home page `section`, `local` (class run by the local server), `used` (parameters that influence the 3D model), `notes` (limitations shown under the parameter list) |
| `viz.js` | 3D model: defines `BUILD.ShutterBox`, the JavaScript port of the generator's `render()` (panels, openers, flexible wall) |
| `schema.json` / `texts.json` | parameter form: English structure and per-language labels, **extracted** by `tools/extract_schemas.py` (do not edit) |
| `i18n/<lang>.json` | translations of the messages (`warn` / `fail` / `notes`) of this generator |

## Limitations

- Door closed along the upper rails (the flexible door bends: no Opening slider, a rigid motion would be wrong). Door position in the groove (centred), handle on the outer face, rails and corner pieces glued against the inside of the sides: deduced, the generator does not place them. Mitre fingers a/A/b/B drawn as straight plates (gaps/overlaps possible at the joints).
- Partial: door, rails and corner pieces placed by deduction; no opening animation because the door is a flexible strip.

## Parameters used by the 3D model

`x`, `y`, `h`, `radius`, `style`, `Flex_connection`, `Flex_distance`, `Flex_width`, `FingerJoint_width`
