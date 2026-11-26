#!/usr/bin/env node
// Copies the shared guide core from the app (../tripshare/src/core/guide.ts) to lib/core/guide.ts.
// The app owns the guide format; this copy is never edited by hand. The copy carries a SHA-256
// of its body, so a hand edit is detected and the sync refuses to overwrite it.
//
//   npm run sync-core               copy the app's core (refuses if the copy was edited by hand)
//   npm run sync-core -- --check    only check that the copy matches the app (exit 1 if not)
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(root, '../tripshare/src/core/guide.ts');
const DEST = resolve(root, 'lib/core/guide.ts');
const HEADER_RE = /^\/\/ GENERATED – DO NOT EDIT\.[^\n]*\n\/\/ [^\n]*sha256: ([0-9a-f]{64})\n\n/;

const sha = text => createHash('sha256').update(text).digest('hex');
const header = hash =>
  '// GENERATED – DO NOT EDIT. Copy of tripshare/src/core/guide.ts (the app owns the guide format).\n' +
  `// Update with \`npm run sync-core\`. sha256: ${hash}\n\n`;

function readCopy() {
  if (!existsSync(DEST)) return null;
  const text = readFileSync(DEST, 'utf8');
  const m = text.match(HEADER_RE);
  if (!m) return { editedByHand: true, hash: null };
  return { editedByHand: sha(text.slice(m[0].length)) !== m[1], hash: m[1] };
}

const fail = msg => { console.error(`sync-core: ${msg}`); process.exit(1); };

if (!existsSync(SRC)) fail(`finner ikke appens kjerne: ${SRC}`);
const source = readFileSync(SRC, 'utf8');
const sourceHash = sha(source);
const copy = readCopy();

if (copy?.editedByHand) {
  fail('lib/core/guide.ts er endret for hånd. Gjør endringen i appen (tripshare/src/core/guide.ts) og kjør sync-core på nytt.');
}

if (process.argv.includes('--check')) {
  if (!copy) fail('lib/core/guide.ts mangler. Kjør npm run sync-core.');
  if (copy.hash !== sourceHash) fail('lib/core/guide.ts er ikke lik appens kjerne. Kjør npm run sync-core.');
  console.log(`sync-core: kopien er lik appens kjerne (sha256 ${sourceHash.slice(0, 12)})`);
  process.exit(0);
}

mkdirSync(dirname(DEST), { recursive: true });
writeFileSync(DEST, header(sourceHash) + source);
console.log(copy?.hash === sourceHash
  ? `sync-core: uendret (sha256 ${sourceHash.slice(0, 12)})`
  : `sync-core: kopiert fra appen (sha256 ${sourceHash.slice(0, 12)})`);
