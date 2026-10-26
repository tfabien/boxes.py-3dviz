# ElectronicsBox

Closed box with screw on top and mounting holes.

Upstream: [`ElectronicsBox`](https://boxes.hackerspace-bamberg.de/ElectronicsBox) on the public Boxes.py instance.

| | |
|---|---|
| Home page section | Boxes |
| Sliders | Explode |
| Parameters | 29 in the form, 9 influence the 3D model (the others are greyed out) |
| Message translations | fr |

## Files

| File | Content |
|---|---|
| `generator.json` | 3D descriptor (hand written): display `order`, home page `section`, `local` (class run by the local server), `used` (parameters that influence the 3D model), `notes` (limitations shown under the parameter list) |
| `viz.js` | 3D model: defines `BUILD.ElectronicsBox`, the JavaScript port of the generator's `render()` (panels, openers, flexible wall) |
| `schema.json` / `texts.json` | parameter form: English structure and per-language labels, **extracted** by `tools/extract_schemas.py` (do not edit) |
| `i18n/<lang>.json` | translations of the messages (`warn` / `fail` / `notes`) of this generator |

## Limitations

- Lid shown inside the cavity (flush with the top of the walls), on the 4 triangles.

## Parameters used by the 3D model

`x`, `y`, `h`, `triangle`, `d1`, `d2`, `d3`, `outsidemounts`, `holedist`
