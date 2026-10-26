# NotesHolder

Box for holding a stack of paper, coasters etc.

Upstream: [`NotesHolder`](https://boxes.hackerspace-bamberg.de/NotesHolder) on the public Boxes.py instance.

| | |
|---|---|
| Home page section | Boxes |
| Sliders | Explode |
| Parameters | 30 in the form, 12 influence the 3D model (the others are greyed out) |
| Message translations | fr |

## Files

| File | Content |
|---|---|
| `generator.json` | 3D descriptor (hand written): display `order`, home page `section`, `local` (class run by the local server), `used` (parameters that influence the 3D model), `notes` (limitations shown under the parameter list) |
| `viz.js` | 3D model: defines `BUILD.NotesHolder`, the JavaScript port of the generator's `render()` (panels, openers, flexible wall) |
| `schema.json` / `texts.json` | parameter form: English structure and per-language labels, **extracted** by `tools/extract_schemas.py` (do not edit) |
| `i18n/<lang>.json` | translations of the messages (`warn` / `fail` / `notes`) of this generator |

## Limitations

- No "outside" parameter (inner dimensions). Fronts with openings, bottom with U notch and dividers are modelled; reinforcement strips are not drawn.
- Partial: `opening = 0` raises an error, as the generator does.

## Parameters used by the 3D model

`sx`, `y`, `h`, `bottom_edge`, `opening`, `back_openings`, `Stackable_angle`, `Stackable_height`, `Stackable_width`, `Stackable_holedistance`, `FingerJoint_edge_width`, `FingerJoint_width`
