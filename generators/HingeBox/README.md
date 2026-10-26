# HingeBox

Box with lid attached by cabinet hinges.

Upstream: [`HingeBox`](https://boxes.hackerspace-bamberg.de/HingeBox) on the public Boxes.py instance.

| | |
|---|---|
| Home page section | Boxes |
| Sliders | Explode, Opening |
| Parameters | 32 in the form, 12 influence the 3D model (the others are greyed out) |
| Message translations | fr |

## Files

| File | Content |
|---|---|
| `generator.json` | 3D descriptor (hand written): display `order`, home page `section`, `local` (class run by the local server), `used` (parameters that influence the 3D model), `notes` (limitations shown under the parameter list) |
| `viz.js` | 3D model: defines `BUILD.HingeBox`, the JavaScript port of the generator's `render()` (panels, openers, flexible wall) |
| `schema.json` / `texts.json` | parameter form: English structure and per-language labels, **extracted** by `tools/extract_schemas.py` (do not edit) |
| `i18n/<lang>.json` | translations of the messages (`warn` / `fail` / `notes`) of this generator |

## Limitations

- Hinge cutouts (u/U) are ported faithfully; the separate hinge parts and the pin are not drawn.
- Partial: hinge axis position deduced.

## Parameters used by the 3D model

`x`, `y`, `h`, `lidheight`, `splitlid`, `CabinetHinge_eyes_per_hinge`, `CabinetHinge_hinges`, `CabinetHinge_eye`, `CabinetHinge_play`, `CabinetHinge_spacing`, `FingerJoint_edge_width`, `FingerJoint_width`
