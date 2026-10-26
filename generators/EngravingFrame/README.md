# EngravingFrame

A frame for an engraving ; can be either standing or hanging, both in portrait or landscape.

Upstream: [`EngravingFrame`](https://boxes.hackerspace-bamberg.de/EngravingFrame) on the public Boxes.py instance.

| | |
|---|---|
| Home page section | Boxes |
| Sliders | Explode |
| Parameters | 29 in the form, 10 influence the 3D model (the others are greyed out) |
| Message translations | fr |

## Files

| File | Content |
|---|---|
| `generator.json` | 3D descriptor (hand written): display `order`, home page `section`, `local` (class run by the local server), `used` (parameters that influence the 3D model), `notes` (limitations shown under the parameter list) |
| `viz.js` | 3D model: defines `BUILD.EngravingFrame`, the JavaScript port of the generator's `render()` (panels, openers, flexible wall) |
| `schema.json` / `texts.json` | parameter form: English structure and per-language labels, **extracted** by `tools/extract_schemas.py` (do not edit) |
| `i18n/<lang>.json` | translations of the messages (`warn` / `fail` / `notes`) of this generator |

## Limitations

- Assembled frame (without the rear support). The engraved plate is drawn with its real thickness.

## Parameters used by the 3D model

`EngravingWidth`, `EngravingHeight`, `EngravingThickness`, `Margin`, `FrameThickness`, `FrameOuterCornersRadius`, `FrameInnerCornersRadius`, `AddCoveringFrontPlate`, `AddDummyFingers`, `FingerJoint_width`
