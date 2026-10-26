# RegularBox

Box with regular polygon as base.

Upstream: [`RegularBox`](https://boxes.hackerspace-bamberg.de/RegularBox) on the public Boxes.py instance.

| | |
|---|---|
| Home page section | Boxes |
| Sliders | Explode |
| Parameters | 27 in the form, 6 influence the 3D model (the others are greyed out) |
| Message translations | fr |

## Files

| File | Content |
|---|---|
| `generator.json` | 3D descriptor (hand written): display `order`, home page `section`, `local` (class run by the local server), `used` (parameters that influence the 3D model), `notes` (limitations shown under the parameter list) |
| `viz.js` | 3D model: defines `BUILD.RegularBox`, the JavaScript port of the generator's `render()` (panels, openers, flexible wall) |
| `schema.json` / `texts.json` | parameter form: English structure and per-language labels, **extracted** by `tools/extract_schemas.py` (do not edit) |
| `i18n/<lang>.json` | translations of the messages (`warn` / `fail` / `notes`) of this generator |

## Limitations

- Angled fingers ported from FingerJointEdge(angle). Lid styles: round discs/plates drawn, holes (circle/polygon) approximated.
- Partial: angled joints drawn as flat-cut plates (no mitre).

## Parameters used by the 3D model

`h`, `radius_bottom`, `radius_top`, `n`, `top`, `bottom`
