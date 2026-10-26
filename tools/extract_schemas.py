#!/usr/bin/env python3
"""Extract the parameter forms of the Boxes.py web generators, in every language of the site.

For each generator listed in src/generators.json this downloads the web form once per language and writes:

  src/i18n/schemas.json  language independent structure (English texts): groups, parameter names, types, defaults,
                         select options, plus the English label / description
  src/i18n/texts.json    per language overlay {lang: {generator: {title, desc, groups: [titles], items: {name: {l, d, o}}}}}
                         l = label, d = description, o = {option value: option label}

The extra generator FlexBox5Plus (not on the public site) is derived from FlexBox5 and the definitions in
src/i18n/custom_flexbox5plus.json.

Usage: python tools/extract_schemas.py [--site https://boxes.hackerspace-bamberg.de] [--langs de,en,es,fr,pt_BR,zh_CN]
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


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--site', default='https://boxes.hackerspace-bamberg.de')
    ap.add_argument('--langs', default=','.join(LANGS))
    a = ap.parse_args()
    langs = a.langs.split(',')
    gens = json.load(open(os.path.join(ROOT, 'src', 'generators.json'), encoding='utf-8'))
    schemas, texts = {}, {l: {} for l in langs}
    for g in gens:
        if g == 'FlexBox5Plus':
            continue
        for l in langs:
            struct, text = split(parse(fetch(a.site, g, l)))
            if l == 'en':
                schemas[g] = struct
            else:
                texts[l][g] = text
            time.sleep(0.15)
        print('extracted', g)
    # local variant derived from FlexBox5
    custom = json.load(open(os.path.join(ROOT, 'src', 'i18n', 'custom_flexbox5plus.json'), encoding='utf-8'))
    base = json.loads(json.dumps(schemas['FlexBox5']))
    base['title'], base['desc'], base['custom'] = custom['en']['title'], custom['en']['desc'], 'FlexBox5Plus'
    extra = custom['items']
    for g in base['groups']:
        if any(i['name'] == 'top_diameter' for i in g['items']):         # the generator-specific group
            for it in extra:
                g['items'].append({'name': it['name'], 'label': it['en'][0], 'desc': it['en'][1], 'type': it['type'], 'default': it['default']})
    schemas['FlexBox5Plus'] = base
    for l in langs:
        if l == 'en':
            continue
        t = json.loads(json.dumps(texts[l]['FlexBox5']))
        t['title'], t['desc'] = custom[l]['title'], custom[l]['desc']
        for it in extra:
            t['items'][it['name']] = {'l': it[l][0], 'd': it[l][1]}
        texts[l]['FlexBox5Plus'] = t
    json.dump(schemas, open(os.path.join(ROOT, 'src', 'i18n', 'schemas.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    json.dump(texts, open(os.path.join(ROOT, 'src', 'i18n', 'texts.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print('written src/i18n/schemas.json and texts.json')


if __name__ == '__main__':
    main()
