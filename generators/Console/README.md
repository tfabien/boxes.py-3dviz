# Console

Console with slanted panel.

Upstream: [`Console`](https://boxes.hackerspace-bamberg.de/Console) on the public Boxes.py instance.

| | |
|---|---|
| Home page section | Boxes |
| Sliders | Explode |
| Parameters | 30 in the form, 6 influence the 3D model (the others are greyed out) |
| Message translations | fr |

## Files

| File | Content |
|---|---|
| `generator.json` | 3D descriptor (hand written): display `order`, home page `section`, `local` (class run by the local server), `used` (parameters that influence the 3D model), `notes` (limitations shown under the parameter list) |
| `viz.js` | 3D model: defines `BUILD.Console`, the JavaScript port of the generator's `render()` (panels, openers, flexible wall) |
| `schema.json` / `texts.json` | parameter form: English structure and per-language labels, **extracted** by `tools/extract_schemas.py` (do not edit) |
| `i18n/<lang>.json` | translations of the messages (`warn` / `fail` / `notes`) of this generator |

## Limitations

- Joints between inclined faces (angles other than 90°): plates with straight ends, no bevel.
- Partial: angled joints drawn as flat-cut plates (no mitre).

## Parameters used by the 3D model

`x`, `y`, `h`, `outside`, `front_height`, `angle`
