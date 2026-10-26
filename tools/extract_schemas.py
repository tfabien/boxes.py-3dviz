#!/usr/bin/env python3
"""Extract the parameter forms of the Boxes.py web generators, in every language of the site.

For each generators/<Name>/ folder this downloads the web form once per language and writes into the folder:

  schema.json  language independent structure (English texts): groups, parameter names, types, defaults,
               select options, plus the English label / description
  texts.json   per language overlay {lang: {title, desc, groups: [titles], items: {name: {l, d, o}}}}
               l = label, d = description, o = {option value: option label}

Usage: python tools/extract_schemas.py [Name ...] [--site https://boxes.hackerspace-bamberg.de] [--langs de,en,es,fr,pt_BR,zh_CN]
Without names, every generator is extracted.
"""
import argparse
import html
import json
import os
import re
import time
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LANGS = ['en', 'de', 'es', 'fr', 'pt_BR', 'zh_CN']


def fetch(site, name, lang):
    url = '%s/%s?language=%s' % (site, name, lang)
    for attempt in range(3):
        try:
            return urllib.request.urlopen(url, timeout=30).read().decode('utf-8')
        except Exception:                      # network hiccup: retry
            time.sleep(1 + attempt)
    raise RuntimeError('cannot fetch ' + url)


def strip(s):
    return html.unescape(re.sub(r'<[^>]+>', '', s)).replace(' ', ' ').strip()


def parse(src):
    title = re.search(r'<h2[^>]*>(.*?)</h2>\s*<p>(.*?)</p>', src, re.S)
    groups = []
    for m in re.finditer(r'<h3[^>]*class="toggle open">(.*?)</h3>\s*<table[^>]*>(.*?)</table>', src, re.S):
        items = []
        for row in re.finditer(r'<tr>(.*?)</tr>', m.group(2), re.S):
            r = row.group(1)
            lab = re.search(r'<label for="([^"]+)">(.*?)</label>', r, re.S)
            if not lab:
                continue
            desc = re.search(r'_description"><p>(.*?)</p>', r, re.S)
            it = {'name': lab.group(1), 'label': strip(lab.group(2)), 'desc': strip(desc.group(1)).replace('\U0001f6c8', '').strip() if desc else ''}
            sel = re.search(r'<select[^>]*>(.*?)</select>', r, re.S)
            if sel:
                it['type'] = 'select'
                it['options'] = [[o[0], strip(o[1])] for o in re.findall(r'<option value="([^"]*)"[^>]*>(.*?)</option>', sel.group(1), re.S)]
                d = re.search(r'<option value="([^"]*)" selected', sel.group(1))
                it['default'] = d.group(1) if d else it['options'][0][0]
            elif 'type="checkbox"' in r:
                it['type'] = 'bool'
                it['default'] = 'checked="checked"' in r
            else:
                it['type'] = 'text'
                it['default'] = re.search(r'type="text" value="([^"]*)"', r).group(1)
            items.append(it)
        groups.append({'title': strip(m.group(1)), 'items': items})
    return {'title': strip(title.group(1)), 'desc': strip(title.group(2)), 'groups': groups}


def split(form):
    """-> (structure, text overlay) for one generator in one language"""
    struct = {'title': form['title'], 'desc': form['desc'], 'groups': []}
    text = {'title': form['title'], 'desc': form['desc'], 'groups': [], 'items': {}}
    for g in form['groups']:
        sg = {'title': g['title'], 'items': []}
        text['groups'].append(g['title'])
        for it in g['items']:
            si = {k: v for k, v in it.items()}
            sg['items'].append(si)
            t = {'l': it['label'], 'd': it['desc']}
            if it['type'] == 'select':
                t['o'] = {v: lab for v, lab in it['options']}
            text['items'][it['name']] = t
        struct['groups'].append(sg)
    return struct, text


def jdump(path, obj):
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)
        f.write('\n')


def load(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('names', nargs='*')
    ap.add_argument('--site', default='https://boxes.hackerspace-bamberg.de')
    ap.add_argument('--langs', default=','.join(LANGS))
    a = ap.parse_args()
    langs = a.langs.split(',')
    gdir = os.path.join(ROOT, 'generators')
    names = a.names or sorted(n for n in os.listdir(gdir) if os.path.isfile(os.path.join(gdir, n, 'generator.json')))
    for g in names:
        schema, texts = None, {}
        for l in langs:
            struct, text = split(parse(fetch(a.site, g, l)))
            if l == 'en':
                schema = struct
            else:
                texts[l] = text
            time.sleep(0.15)
        jdump(os.path.join(gdir, g, 'schema.json'), schema)
        jdump(os.path.join(gdir, g, 'texts.json'), texts)
        print('extracted', g)


if __name__ == '__main__':
    main()
