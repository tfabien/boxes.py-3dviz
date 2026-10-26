# UniversalBox

Box with various options for different styles and lids.

Upstream: [`UniversalBox`](https://boxes.hackerspace-bamberg.de/UniversalBox) on the public Boxes.py instance.

| | |
|---|---|
| Home page section | Boxes |
| Sliders | Explode |
| Parameters | 87 in the form, 8 influence the 3D model (the others are greyed out) |
| Message translations | none yet (English) |

## Files

| File | Content |
|---|---|
| `generator.json` | 3D descriptor (hand written): display `order`, home page `section`, `local` (class run by the local server), `used` (parameters that influence the 3D model), `notes` (limitations shown under the parameter list) |
| `viz.js` | 3D model: defines `BUILD.UniversalBox`, the JavaScript port of the generator's `render()` (panels, openers, flexible wall) |
| `schema.json` / `texts.json` | parameter form: English structure and per-language labels, **extracted** by `tools/extract_schemas.py` (do not edit) |
| `i18n/<lang>.json` | translations of the messages (`warn` / `fail` / `notes`) of this generator |

## Limitations

- Only edges e, f, F, h are modelled; special lids are not drawn.
- Partial: only top edges e, f, F, h; no "top hole" panel.

## Parameters used by the 3D model

`top_edge`, `bottom_edge`, `x`, `y`, `h`, `vertical_edges`, `FingerJoint_edge_width`, `FingerJoint_width`
