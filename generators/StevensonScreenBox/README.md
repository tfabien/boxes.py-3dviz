# StevensonScreenBox

A box with Stevenson Screens front and back.

Upstream: [`StevensonScreenBox`](https://boxes.hackerspace-bamberg.de/StevensonScreenBox) on the public Boxes.py instance.

| | |
|---|---|
| Home page section | Boxes |
| Sliders | Explode |
| Parameters | 28 in the form, 9 influence the 3D model (the others are greyed out) |
| Message translations | fr |

## Files

| File | Content |
|---|---|
| `generator.json` | 3D descriptor (hand written): display `order`, home page `section`, `local` (class run by the local server), `used` (parameters that influence the 3D model), `notes` (limitations shown under the parameter list) |
| `viz.js` | 3D model: defines `BUILD.StevensonScreenBox`, the JavaScript port of the generator's `render()` (panels, openers, flexible wall) |
| `schema.json` / `texts.json` | parameter form: English structure and per-language labels, **extracted** by `tools/extract_schemas.py` (do not edit) |
| `i18n/<lang>.json` | translations of the messages (`warn` / `fail` / `notes`) of this generator |

## Limitations

- Walls, slats, upper strips and roof are modelled; base plate and mounting parts are not drawn.

## Parameters used by the 3D model

`slat_angle`, `slat_overlap`, `slat_depth`, `x`, `y`, `h`, `top_slope`, `roof_top`, `FingerJoint_width`
