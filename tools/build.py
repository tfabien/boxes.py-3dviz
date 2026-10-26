#!/usr/bin/env python3
"""Build the single-file viewer boxes.py-3dviz.html from the sources in src/.

  src/template.html          page, engine and the built-in generators
  src/modules/*.js           one module per additional generator (each registers BUILD / USED / NOTES)
  src/i18n/schemas.json      parameter structure of every generator (tools/extract_schemas.py)
  src/i18n/texts.json        labels / descriptions per language (tools/extract_schemas.py)
  src/i18n/ui.<lang>.json    translations of the interface and of the messages of template.html
  src/i18n/modules/<lang>_<Module>.json  translations of the messages of one module

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


def messages():
    msg = {}
    for path in sorted(glob.glob(os.path.join(ROOT, 'src', 'i18n', 'ui.*.json'))):
        lang = os.path.basename(path).split('.')[1]
        msg.setdefault(lang, {}).update({k.strip(): v.strip() for k, v in json.loads(read(path)).items()})
    for path in sorted(glob.glob(os.path.join(ROOT, 'src', 'i18n', 'modules', '*_*.json'))):
        lang = os.path.basename(path).split('_')[0]
        msg.setdefault(lang, {}).update({k.strip(): v.strip() for k, v in json.loads(read(path)).items()})
    return msg


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('-o', '--output', default=os.path.join(ROOT, 'boxes.py-3dviz.html'))
    a = ap.parse_args()
    modules = sorted(glob.glob(os.path.join(ROOT, 'src', 'modules', '*.js')))
    code = '\n'.join('// ==== module %s ====\n%s' % (os.path.basename(m), read(m)) for m in modules)
    page = read(os.path.join(ROOT, 'src', 'template.html'))
    for marker, value in (('/*MODULES*/', code),
                          ('/*SCHEMAS*/null', read(os.path.join(ROOT, 'src', 'i18n', 'schemas.json'))),
                          ('/*TEXTS*/null', read(os.path.join(ROOT, 'src', 'i18n', 'texts.json'))),
                          ('/*MSG*/{}', json.dumps(messages(), ensure_ascii=False, separators=(',', ':')))):
        assert marker in page, marker
        page = page.replace(marker, value)
    with open(a.output, 'w', encoding='utf-8', newline='\n') as f:
        f.write(page)
    print('built %s (%d modules, %d KiB)' % (a.output, len(modules), len(page.encode('utf-8')) // 1024))


if __name__ == '__main__':
    main()
