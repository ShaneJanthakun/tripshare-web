#!/usr/bin/env node
// Copies the app's texts into the website's message files, under the key `app`
// (plan/03-fase-0-grunnmur.md, F0.8). The app is the source: never edit messages/*.json → app.*
// by hand. i18next placeholders {{x}} become ICU {x}, and every string is validated with the
// ICU parser that next-intl uses, so one bad string can't break the build later.
//
//   npm run sync-strings               copy
//   npm run sync-strings -- --check    only check that app.* matches the app (exit 1 if not)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, TYPE } from '@formatjs/icu-messageformat-parser';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const APP_LOCALES = resolve(root, '../tripshare/src/i18n/locales');
const LANGS = ['en', 'no', 'es', 'fr', 'pt', 'th', 'ja', 'zh', 'ko', 'de'];
const NAMESPACES = ['guideDetail', 'createGuide', 'tags', 'mapPicker', 'auth', 'common', 'home', 'profile'];
const check = process.argv.includes('--check');
const errors = [];

// i18next → ICU. An apostrophe right before a brace would start an ICU quote, so it is doubled.
function toIcu(text) {
  return text.replace(/'(?=[{}])/g, "''").replace(/\{\{\s*([\w.]+)\s*\}\}/g, '{$1}');
}

function argNames(elements, out = new Set()) {
  for (const el of elements) {
    if (el.type === TYPE.argument || el.type === TYPE.number || el.type === TYPE.date || el.type === TYPE.time) out.add(el.value);
    if (el.options) for (const opt of Object.values(el.options)) argNames(opt.value, out);
    if (el.children) argNames(el.children, out);
  }
  return out;
}

function convert(value, path, lang) {
  if (typeof value === 'string') {
    const icu = toIcu(value);
    const expected = new Set([...value.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)].map(m => m[1]));
    try {
      const found = argNames(parse(icu));
      const same = found.size === expected.size && [...expected].every(n => found.has(n));
      if (!same) errors.push(`${lang} ${path}: variablene ${[...expected]} ble ${[...found]}`);
    } catch (e) {
      errors.push(`${lang} ${path}: ugyldig ICU (${e.message}): ${value.slice(0, 80)}`);
    }
    return icu;
  }
  if (Array.isArray(value)) return value.map((v, i) => convert(v, `${path}[${i}]`, lang));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => {
      if (k.includes('.')) errors.push(`${lang} ${path}.${k}: punktum i nøkkelen virker ikke i next-intl`);
      return [k, convert(v, `${path}.${k}`, lang)];
    }));
  }
  return value;
}

let changed = 0;
for (const lang of LANGS) {
  const appFile = resolve(APP_LOCALES, `${lang}.json`);
  const webFile = resolve(root, `messages/${lang}.json`);
  if (!existsSync(appFile)) { errors.push(`${lang}: finner ikke ${appFile}`); continue; }
  const app = JSON.parse(readFileSync(appFile, 'utf8'));
  const raw = readFileSync(webFile, 'utf8');
  const web = JSON.parse(raw);
  const picked = {};
  for (const ns of NAMESPACES) {
    if (!(ns in app)) { errors.push(`${lang}: navnerommet ${ns} mangler i appen`); continue; }
    picked[ns] = convert(app[ns], `app.${ns}`, lang);
  }
  const next = { ...web, app: picked };
  const out = JSON.stringify(next, null, 2) + (raw.endsWith('\n') ? '\n' : '');
  if (out !== raw) {
    changed++;
    if (!check) writeFileSync(webFile, out);
  }
}

if (errors.length) {
  console.error(`sync-strings: ${errors.length} feil – ingenting er sikkert ennå:`);
  errors.slice(0, 40).forEach(e => console.error(`  ${e}`));
  process.exit(1);
}
if (check) {
  if (changed) { console.error(`sync-strings: ${changed} språkfil(er) er ikke synket med appen. Kjør npm run sync-strings.`); process.exit(1); }
  console.log('sync-strings: app.* er lik appens tekster i alle 10 språk.');
} else {
  console.log(`sync-strings: ${changed} språkfil(er) oppdatert, ${LANGS.length} språk validert.`);
}
