#!/usr/bin/env python3
"""Build the single-file viewer index.html from the sources.

  src/template.html                page, engine and i18n core
  src/i18n/ui.<lang>.json          translations of the interface and of the messages of the template
  generators/<Name>/               one folder per generator (see generators/README.md):
      generator.json               3D descriptor: order, section, local variant, parameters used by the 3D model, notes
      viz.js                       3D model (defines BUILD.<Name>)
      schema.json, texts.json      parameter form (English structure + per language texts), from tools/extract_schemas.py
      i18n/<lang>.json             translations of the messages of viz.js
      README.md                    what is modelled / not

All messages are written in English in the code; the JSON files map the English text to its translation
(keys are trimmed). Usage: python tools/build.py [-o OUTPUT]
"""
import argparse
import glob
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def read(path):
    with open(path, encoding='utf-8') as f:
        return f.read()


def load(path):
    return json.loads(read(path))


def generators():
    """[(name, folder, descriptor)] sorted by display order"""
    out = []
    for path in glob.glob(os.path.join(ROOT, 'generators', '*', 'generator.json')):
        folder = os.path.dirname(path)
        out.append((os.path.basename(folder), folder, load(path)))
    return sorted(out, key=lambda g: (g[2].get('order', 1e9), g[0]))


def messages(gens):
    msg = {}
    paths = [(os.path.basename(p).split('.')[1], p) for p in sorted(glob.glob(os.path.join(ROOT, 'src', 'i18n', 'ui.*.json')))]
    for _, folder, _ in gens:
        paths += [(os.path.basename(p)[:-5], p) for p in sorted(glob.glob(os.path.join(folder, 'i18n', '*.json')))]
    for lang, path in paths:
        msg.setdefault(lang, {}).update({k.strip(): v.strip() for k, v in load(path).items()})
    return msg


def compact(obj):
    return json.dumps(obj, ensure_ascii=False, separators=(',', ':'))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('-o', '--output', default=os.path.join(ROOT, 'index.html'))
    a = ap.parse_args()
    gens = generators()
    schemas, texts = {}, {}
    for name, folder, desc in gens:
        schemas[name] = load(os.path.join(folder, 'schema.json'))
        if desc.get('local'):
            schemas[name]['custom'] = desc['local']
        for lang, t in load(os.path.join(folder, 'texts.json')).items():
            texts.setdefault(lang, {})[name] = t
    code = '\n'.join('// ==== generator %s ====\n%s' % (name, read(os.path.join(folder, 'viz.js'))) for name, folder, _ in gens)
    page = read(os.path.join(ROOT, 'src', 'template.html'))
    for marker, value in (('/*GENERATORS*/', code),
                          ('/*SCHEMAS*/null', compact(schemas)),
                          ('/*TEXTS*/null', compact(texts)),
                          ('/*USED*/{}', compact({n: d.get('used', []) for n, _, d in gens})),
                          ('/*NOTES*/{}', compact({n: d['notes'] for n, _, d in gens if d.get('notes')})),
                          ('/*SECTION*/{}', compact({n: d.get('section', 'boxes') for n, _, d in gens})),
                          ('/*ORDER*/[]', compact([n for n, _, _ in gens])),
                          ('/*MSG*/{}', compact(messages(gens)))):
        assert marker in page, marker
        page = page.replace(marker, value)
    os.makedirs(os.path.dirname(os.path.abspath(a.output)), exist_ok=True)
    with open(a.output, 'w', encoding='utf-8', newline='\n') as f:
        f.write(page)
    print('built %s (%d generators, %d KiB)' % (a.output, len(gens), len(page.encode('utf-8')) // 1024))


if __name__ == '__main__':
    main()
