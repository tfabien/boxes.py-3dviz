# BayonetBox

Round box made from layers with twist on top.

Upstream: [`BayonetBox`](https://boxes.hackerspace-bamberg.de/BayonetBox) on the public Boxes.py instance.

| | |
|---|---|
| Home page section | Boxes |
| Sliders | Explode, Opening |
| Parameters | 14 in the form, 3 influence the 3D model (the others are greyed out) |
| Message translations | fr |

## Files

| File | Content |
|---|---|
| `generator.json` | 3D descriptor (hand written): display `order`, home page `section`, `local` (class run by the local server), `used` (parameters that influence the 3D model), `notes` (limitations shown under the parameter list) |
| `viz.js` | 3D model: defines `BUILD.BayonetBox`, the JavaScript port of the generator's `render()` (panels, openers, flexible wall) |
| `schema.json` / `texts.json` | parameter form: English structure and per-language labels, **extracted** by `tools/extract_schemas.py` (do not edit) |
| `i18n/<lang>.json` | translations of the messages (`warn` / `fail` / `notes`) of this generator |

## Limitations

- Five stacked discs of thickness t, with the rings and lugs of the generator.
- Partial: layer order deduced, no lift after unlocking.

## Parameters used by the 3D model

`diameter`, `lugs`, `alignment_pins`
