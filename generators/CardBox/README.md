# CardBox

Box for storage of playing cards, with versatile options.

Upstream: [`CardBox`](https://boxes.hackerspace-bamberg.de/CardBox) on the public Boxes.py instance.

| | |
|---|---|
| Home page section | Boxes |
| Sliders | Explode, Opening |
| Parameters | 27 in the form, 7 influence the 3D model (the others are greyed out) |
| Message translations | fr |

## Files

| File | Content |
|---|---|
| `generator.json` | 3D descriptor (hand written): display `order`, home page `section`, `local` (class run by the local server), `used` (parameters that influence the 3D model), `notes` (limitations shown under the parameter list) |
| `viz.js` | 3D model: defines `BUILD.CardBox`, the JavaScript port of the generator's `render()` (panels, openers, flexible wall) |
| `schema.json` / `texts.json` | parameter form: English structure and per-language labels, **extracted** by `tools/extract_schemas.py` (do not edit) |
| `i18n/<lang>.json` | translations of the messages (`warn` / `fail` / `notes`) of this generator |

## Limitations

- Layout inferred from the code and the detail photo; thickness of glued parts = t.
- Partial: dividers lightly checked.

## Parameters used by the 3D model

`y`, `h`, `sx`, `openingdirection`, `fingerhole`, `fingerhole_depth`, `add_lidtopper`
