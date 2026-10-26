# HalfBox

Configurable half of a box which can be: a bookend, a hanging shelf, an angle clamping jig.

Upstream: [`HalfBox`](https://boxes.hackerspace-bamberg.de/HalfBox) on the public Boxes.py instance.

| | |
|---|---|
| Home page section | Boxes |
| Sliders | Explode |
| Parameters | 32 in the form, 9 influence the 3D model (the others are greyed out) |
| Message translations | fr |

## Files

| File | Content |
|---|---|
| `generator.json` | 3D descriptor (hand written): display `order`, home page `section`, `local` (class run by the local server), `used` (parameters that influence the 3D model), `notes` (limitations shown under the parameter list) |
| `viz.js` | 3D model: defines `BUILD.HalfBox`, the JavaScript port of the generator's `render()` (panels, openers, flexible wall) |
| `schema.json` / `texts.json` | parameter form: English structure and per-language labels, **extracted** by `tools/extract_schemas.py` (do not edit) |
| `i18n/<lang>.json` | translations of the messages (`warn` / `fail` / `notes`) of this generator |

## Limitations

- Mounting edge (Mounting) not modelled; in Sturdy mode the clamping slots do not cut the notches.
- Partial: mounting edge drawn plain.

## Parameters used by the 3D model

`x`, `sy`, `h`, `Clamping`, `ClampingSize`, `Mounting`, `Sturdy`, `FingerJoint_edge_width`, `FingerJoint_width`
