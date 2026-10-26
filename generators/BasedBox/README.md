# BasedBox

Fully closed box on a base.

Upstream: [`BasedBox`](https://boxes.hackerspace-bamberg.de/BasedBox) on the public Boxes.py instance.

| | |
|---|---|
| Home page section | Boxes |
| Sliders | Explode |
| Parameters | 32 in the form, 6 influence the 3D model (the others are greyed out) |
| Message translations | none yet (English) |

## Files

| File | Content |
|---|---|
| `generator.json` | 3D descriptor (hand written): display `order`, home page `section`, `local` (class run by the local server), `used` (parameters that influence the 3D model), `notes` (limitations shown under the parameter list) |
| `viz.js` | 3D model: defines `BUILD.BasedBox`, the JavaScript port of the generator's `render()` (panels, openers, flexible wall) |
| `schema.json` / `texts.json` | parameter form: English structure and per-language labels, **extracted** by `tools/extract_schemas.py` (do not edit) |
| `i18n/<lang>.json` | translations of the messages (`warn` / `fail` / `notes`) of this generator |

## Limitations

- Partial: only top edges e, f, F, h; no "top hole" panel.

## Parameters used by the 3D model

`top_edge`, `x`, `y`, `h`, `FingerJoint_edge_width`, `FingerJoint_width`
