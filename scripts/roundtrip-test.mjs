#!/usr/bin/env node
// Round-trip test for the shared guide core (plan/10-testing.md, F0.7).
// Fetches every guide visible without logging in and checks that
//   guideToRow(migrate(row.data)).data
// keeps every field and value of row.data. Run after every sync-core and before publishing
// anything that touches saving. Exit code 1 if data would be lost or changed.
//
// Allowed on purpose (listed, not errors):
//   - keys that only exist in the output (defaults filled in by migrate)
//   - upvotes and comments (guideToRow drops them: they live in their own column / table)
//   - password (old field, removed by migrate) and lastEditedOn (set on every save)
//   - accessCode emptied on public guides (a public row must not carry a code)
//   - local file:// images dropped (they were never uploaded)
import { migrate, guideToRow } from '../lib/core/guide.ts';

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://fovddldyfhspgejjkvtd.supabase.co';
// Publishable key: public by design (it is in the app and the website).
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'sb_publishable_gaU8HM4KiihRkbG3kqL7pw_7NdpdQ-f';

const res = await fetch(`${URL_}/rest/v1/guides?select=id,data&order=id&limit=10000`, {
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
});
if (!res.ok) { console.error(`Kunne ikke hente guider: HTTP ${res.status}`); process.exit(2); }
const rows = await res.json();

const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const shape = path => path.replace(/\[\d+\]/g, '[]');
const errors = [];
const added = new Map();
const intended = new Map();
const note = (map, key) => map.set(key, (map.get(key) ?? 0) + 1);

function compare(a, b, path, ctx) {
  if (isObj(a)) {
    if (!isObj(b)) { errors.push(`${ctx.id} ${path}: objekt ble ${JSON.stringify(b)}`); return; }
    for (const k of Object.keys(a)) {
      const p = path ? `${path}.${k}` : k;
      if (!path && (k === 'upvotes' || k === 'comments' || k === 'password')) { note(intended, `${k} fjernet`); continue; }
      if (!path && k === 'lastEditedOn') { note(intended, 'lastEditedOn satt'); continue; }
      if (!path && k === 'accessCode' && ctx.isPublic && a[k] !== '' && b[k] === '') { note(intended, 'accessCode tømt (offentlig guide)'); continue; }
      if (!(k in b)) { errors.push(`${ctx.id} ${p}: mangler etter lagring`); continue; }
      compare(a[k], b[k], p, ctx);
    }
    for (const k of Object.keys(b)) if (!(k in a)) note(added, shape(path ? `${path}.${k}` : k));
    return;
  }
  if (Array.isArray(a)) {
    if (!Array.isArray(b)) { errors.push(`${ctx.id} ${path}: liste ble ${JSON.stringify(b)}`); return; }
    if (a.every(x => typeof x === 'string') && a.length !== b.length) {
      const dropped = a.filter(x => !b.includes(x));
      const local = dropped.filter(x => x.startsWith('file://'));
      if (local.length) note(intended, 'lokale file://-bilder fjernet');
      const lost = dropped.filter(x => !x.startsWith('file://'));
      if (lost.length) errors.push(`${ctx.id} ${path}: ${lost.length} verdi(er) fjernet, f.eks. ${JSON.stringify(lost[0]).slice(0, 80)}`);
      return;
    }
    if (a.length !== b.length) { errors.push(`${ctx.id} ${path}: ${a.length} elementer ble ${b.length}`); return; }
    a.forEach((x, i) => compare(x, b[i], `${path}[${i}]`, ctx));
    return;
  }
  if (a !== b) {
    if (typeof a === 'string' && a.startsWith('file://') && b === '') { note(intended, 'lokale file://-bilder fjernet'); return; }
    errors.push(`${ctx.id} ${path}: ${JSON.stringify(a)?.slice(0, 60)} ble ${JSON.stringify(b)?.slice(0, 60)}`);
  }
}

let checked = 0;
for (const row of rows) {
  if (!isObj(row.data)) { errors.push(`${row.id}: data er ikke et objekt`); continue; }
  const out = guideToRow(migrate(row.data), 'app').data;
  compare(row.data, out, '', { id: row.id, isPublic: out.isPublic !== false });
  checked++;
}

console.log(`Rundturtest: ${checked} guider sjekket.`);
if (intended.size) {
  console.log('\nTilsiktede endringer:');
  for (const [k, n] of [...intended].sort()) console.log(`  ${k}: ${n}`);
}
if (added.size) {
  console.log('\nStandardverdier lagt til av migrate (godtatt):');
  for (const [k, n] of [...added].sort((x, y) => y[1] - x[1])) console.log(`  ${k}: ${n}`);
}
if (errors.length) {
  console.log(`\nFEIL: ${errors.length} felt ville blitt mistet eller endret:`);
  errors.slice(0, 60).forEach(e => console.log(`  ${e}`));
  if (errors.length > 60) console.log(`  … og ${errors.length - 60} til`);
  process.exit(1);
}
console.log('\nOK: 0 felt mistet og 0 verdier endret.');
