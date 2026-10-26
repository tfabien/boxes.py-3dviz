#!/usr/bin/env python3
"""List the English messages used in the sources (warn(), fail(), NOTES.<Type>) that have no translation in a language.

Usage: python tools/check_messages.py [lang ...]     (default: fr)
"""
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STR = r"(?:'((?:[^'\\]|\\.)*)'|\"((?:[^\"\\]|\\.)*)\")"
PATTERNS = [re.compile(r"\b(?:warn|fail)\(\s*" + STR), re.compile(r'"notes"\s*:\s*' + STR)]


def load(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def used_messages():
    used = {}
    for path in glob.glob(os.path.join(ROOT, 'generators', '*', 'viz.js')) + glob.glob(os.path.join(ROOT, 'generators', '*', 'generator.json')) + [os.path.join(ROOT, 'src', 'template.html')]:
        with open(path, encoding='utf-8') as f:
            src = f.read()
        for pat in PATTERNS[:2]:
            for m in pat.finditer(src):
                text = (m.group(1) or m.group(2) or '').replace("\\'", "'").replace('\\"', '"').strip()
                used.setdefault(text, os.path.basename(path))
    return used


def translated(lang):
    keys = set()
    for path in glob.glob(os.path.join(ROOT, 'src', 'i18n', 'ui.%s.json' % lang)) + glob.glob(os.path.join(ROOT, 'generators', '*', 'i18n', '%s.json' % lang)):
        keys |= {k.strip() for k in load(path)}
    return keys


def main():
    langs = sys.argv[1:] or ['fr']
    used = used_messages()
    print('%d distinct messages in the sources' % len(used))
    for lang in langs:
        have = translated(lang)
        missing = {t: f for t, f in used.items() if t not in have}
        print('%s: %d translated, %d missing' % (lang, len(used) - len(missing), len(missing)))
        for t, f in sorted(missing.items(), key=lambda kv: kv[1]):
            print('   %-24s %s' % (f, t[:110]))


if __name__ == '__main__':
    main()
