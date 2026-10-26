# PirateChest

Box with polygon lid with chest hinges.

Upstream: [`PirateChest`](https://boxes.hackerspace-bamberg.de/PirateChest) on the public Boxes.py instance.

| | |
|---|---|
| Home page section | Boxes |
| Sliders | Explode, Opening |
| Parameters | 30 in the form, 6 influence the 3D model (the others are greyed out) |
| Message translations | fr |

## Files

| File | Content |
|---|---|
| `generator.json` | 3D descriptor (hand written): display `order`, home page `section`, `local` (class run by the local server), `used` (parameters that influence the 3D model), `notes` (limitations shown under the parameter list) |
| `viz.js` | 3D model: defines `BUILD.PirateChest`, the JavaScript port of the generator's `render()` (panels, openers, flexible wall) |
| `schema.json` / `texts.json` | parameter form: English structure and per-language labels, **extracted** by `tools/extract_schemas.py` (do not edit) |
| `i18n/<lang>.json` | translations of the messages (`warn` / `fail` / `notes`) of this generator |

## Limitations

- Lid mitre joints are approximated as straight notches; hinge discs/pins are not drawn.
- Partial: lid mitre joints drawn as flat-cut plates.

## Parameters used by the 3D model

`x`, `y`, `h`, `n`, `FingerJoint_edge_width`, `FingerJoint_width`
