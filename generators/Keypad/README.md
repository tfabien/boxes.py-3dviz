# Keypad

Generator for keypads with mechanical switches.

Upstream: [`Keypad`](https://boxes.hackerspace-bamberg.de/Keypad) on the public Boxes.py instance.

| | |
|---|---|
| Home page section | Boxes |
| Sliders | Explode |
| Parameters | 28 in the form, 9 influence the 3D model (the others are greyed out) |
| Message translations | fr |

## Files

| File | Content |
|---|---|
| `generator.json` | 3D descriptor (hand written): display `order`, home page `section`, `local` (class run by the local server), `used` (parameters that influence the 3D model), `notes` (limitations shown under the parameter list) |
| `viz.js` | 3D model: defines `BUILD.Keypad`, the JavaScript port of the generator's `render()` (panels, openers, flexible wall) |
| `schema.json` / `texts.json` | parameter form: English structure and per-language labels, **extracted** by `tools/extract_schemas.py` (do not edit) |
| `i18n/<lang>.json` | translations of the messages (`warn` / `fail` / `notes`) of this generator |

## Limitations

- Stacked plates (thicknesses t / top1 / top2); recessed bottom plate resting on the triangles, inferred from the code.
- Partial: screw holes, plate stacking deduced.

## Parameters used by the 3D model

`h`, `top1_thickness`, `top2_enable`, `top2_thickness`, `pcb_mount_enable`, `led_enable`, `diode_enable`, `cutout_type`, `columns_definition`
