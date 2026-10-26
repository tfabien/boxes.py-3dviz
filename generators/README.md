# Generators

One folder per supported Boxes.py generator. `python tools/build.py` assembles every folder into the single-file viewer (`index.html`).

```
generators/<Name>/
  generator.json      3D descriptor, hand written
  viz.js              3D model, hand written
  schema.json         parameter form (English), extracted from Boxes.py
  texts.json          labels / help texts per language, extracted from Boxes.py
  i18n/<lang>.json    translations of the messages of viz.js and of the notes (optional)
  README.md           what is modelled and what is not
```

`schema.json` and `texts.json` are the **fields** part: they mirror the real generator form and are produced by `tools/extract_schemas.py` (they are committed so that the build needs no network access; re-run the tool when Boxes.py changes). Everything else is the **3D** part, written and reviewed here.

## `generator.json`

| Key | Meaning |
|---|---|
| `order` | position in the lists (the home page and the selector sort on it; leave gaps of 10) |
| `section` | home page section: `boxes` or `flex` (boxes with a flexible hinge) |
| `local` | optional: name of a generator that is not on the public site; the viewer then calls a local Boxes.py server for the cut plan (see the `flexbox5plus` branch) |
| `used` | parameters that influence the 3D model; every other parameter is greyed out in the form |
| `notes` | optional English text shown under the parameter list (limitations, approximations) |

## `viz.js`

Defines `BUILD.<Name> = function (c) { ... }`, which receives the common context (`c.t` thickness, `c.num(name)`, `c.F` finger settings, `c.adj` / `c.sub` size helpers...) and returns a model:

- `{kind: 'box', panels: [...]}` for rigid boxes, with `panel(outline, t, origin, u, v, dir)` for each plate (`dir` = outward direction used by the *Explode* slider);
- `flexModel(...)` for boxes with a flexible wall (this enables the *Unfold* slider);
- `openers: [{parts, point, axis, angle} | {parts, slide}]` to describe how parts move for the *Opening* slider (rotation about an axis, or sliding along a vector). Add `from` / `to` (0..1) to an opener so that it only moves during that part of the slider; this chains steps (BayonetBox: twist during 0-0.5, then lift during 0.5-1).

Geometry helpers (`rectOutline`, `trapOutline`, `fingerLayout`, `turtle`, `flexModel`, `boxEdges`...) live in `src/template.html`. Report approximations with `warn('message')` and invalid parameters with `fail('message')`; messages are written in English and translated in `i18n/<lang>.json` (`python tools/check_messages.py <lang>` lists the missing ones).

## Adding a generator

1. `mkdir generators/<Name>` and write `generator.json` and `viz.js`.
2. `python tools/extract_schemas.py <Name>` to fetch the form (needs network).
3. Optional: `README.md`, `i18n/<lang>.json`.
4. `python tools/build.py`, open `index.html#<Name>`.
