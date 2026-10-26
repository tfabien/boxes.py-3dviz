# DiceBox

Box with lid and integrated hinge for storing dice.

Upstream: [`DiceBox`](https://boxes.hackerspace-bamberg.de/DiceBox) on the public Boxes.py instance.

| | |
|---|---|
| Home page section | Boxes |
| Sliders | Explode, Opening |
| Parameters | 31 in the form, 13 influence the 3D model (the others are greyed out) |
| Message translations | fr |

## Files

| File | Content |
|---|---|
| `generator.json` | 3D descriptor (hand written): display `order`, home page `section`, `local` (class run by the local server), `used` (parameters that influence the 3D model), `notes` (limitations shown under the parameter list) |
| `viz.js` | 3D model: defines `BUILD.DiceBox`, the JavaScript port of the generator's `render()` (panels, openers, flexible wall) |
| `schema.json` / `texts.json` | parameter form: English structure and per-language labels, **extracted** by `tools/extract_schemas.py` (do not edit) |
| `i18n/<lang>.json` | translations of the messages (`warn` / `fail` / `notes`) of this generator |

## Limitations

- Hexagonal holes and magnets are drawn; hinge discs and pins are not drawn.

## Parameters used by the 3D model

`x`, `y`, `h`, `lidheight`, `hex_hole_corner_radius`, `magnet_diameter`, `ChestHinge_finger_joints_on_box`, `ChestHinge_finger_joints_on_lid`, `ChestHinge_hinge_strength`, `ChestHinge_pin_height`, `ChestHinge_play`, `FingerJoint_edge_width`, `FingerJoint_width`
