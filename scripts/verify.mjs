#!/usr/bin/env node
//
// scripts/verify.mjs — repository invariants that are NOT about rendering.
//
// The division of labour with scripts/build.mjs is deliberate and worth stating,
// because it is the thing that keeps both files honest:
//
//   build.mjs   owns everything it can check from the objects it is holding: the
//               corpus hash, the row shape, the byte budgets, and the link graph
//               validated against the links its own renderers BUILT.
//   verify.mjs  owns everything you can only check by reading the repository
//               back off disk as a stranger would: the data against its
//               published schema, the locale files against each other, and the
//               generated markdown re-parsed rather than trusted.
//
// So this file re-parses. That is the point — it is the second opinion. It does
// it correctly, though: fenced code blocks are stripped before any scan, because
// the prompt bodies are verbatim third-party text and one of them contains
// `](brief.md#hero)`-shaped punctuation, 3 contain a pipe and one describes a
// "license plate". A rival's link checker regexed straight over generated
// markdown and a community prompt killed its publish in seven files with an
// error naming a file nobody wrote.
//
// Zero dependencies, including the JSON Schema validator, which is hand-rolled
// against the subset of draft 2020-12 that data/prompts.schema.json actually
// uses. No network. `node scripts/verify.mjs && node scripts/build.mjs --check`
// on a fresh clone is the whole of CI.
//
// LICENCE PASS DEFERRED: this file deliberately contains no LICENSE check, no
// SPDX check and no rights assertion. Those arrive with that pass.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const LOCALES = ['en', 'zh', 'es', 'ja', 'ar', 'pt'];
const RLM = '\u200F';

const readText = (rel) => readFileSync(join(ROOT, rel), 'utf8');
const readJson = (rel) => JSON.parse(readText(rel));
const cmpU16 = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const num = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

let failed = 0;
let checks = 0;
function check(label, ok, measured) {
  checks++;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label.padEnd(52, '.')} ${measured}`);
  if (!ok) failed++;
}

console.log('awesome-gpt-image-2-5-prompts verify\n');

// ---------------------------------------------------------------------------
// 1. Files that must exist
// ---------------------------------------------------------------------------

console.log('files');

const INPUTS = [
  'data/prompts.json',
  'data/prompts.schema.json',
  'data/removed.json',
  'scripts/build.mjs',
  'scripts/verify.mjs',
  'llms.txt.tmpl',
  'package.json',
  ...LOCALES.map((l) => `locales/${l}.json`),
];
const missingInputs = INPUTS.filter((p) => !existsSync(join(ROOT, p)));
check('every input file is present', missingInputs.length === 0, missingInputs.length ? missingInputs.join(', ') : `${INPUTS.length} files`);
if (missingInputs.length) process.exit(1);

const doc = readJson('data/prompts.json');
const schema = readJson('data/prompts.schema.json');
const meta = doc._meta;

// The output set is derived the same way build.mjs derives it — from the
// category list in the data — so a category added to the corpus makes this
// check demand the new file rather than quietly ignoring it.
const USE_CASE = {
  poster: 'poster',
  'typography-text': 'text-in-image',
  infographic: 'infographic',
  'ui-mockup': 'ui-mockup',
  'ecommerce-product': 'product-photo',
  'ad-creative': 'ad-creative',
  'character-design': 'character-design',
  portrait: 'portrait',
  illustration: 'illustration',
};
const promptFilePath = (c) => `prompts/gpt-image-2-5-${USE_CASE[c]}-prompts.md`;
const readmePath = (l) => (l === 'en' ? 'README.md' : `README.${l}.md`);
const OUTPUTS = [
  ...LOCALES.map(readmePath),
  ...meta.categories.map(promptFilePath),
  'llms.txt',
  'metadata/about.txt',
  'ATTRIBUTION.md',];

const missingStems = meta.categories.filter((c) => !USE_CASE[c]);
check('every category has a known file stem', missingStems.length === 0, missingStems.length ? missingStems.join(', ') : `${meta.categories.length} categories`);

const missingOutputs = OUTPUTS.filter((p) => !existsSync(join(ROOT, p)));
check('every generated file is present', missingOutputs.length === 0, missingOutputs.length ? missingOutputs.join(', ') : `${OUTPUTS.length} files`);
const emptyOutputs = OUTPUTS.filter((p) => existsSync(join(ROOT, p)) && statSync(join(ROOT, p)).size === 0);
check('no generated file is empty', emptyOutputs.length === 0, emptyOutputs.length ? emptyOutputs.join(', ') : `${OUTPUTS.length} files, ${num(OUTPUTS.filter((p) => existsSync(join(ROOT, p))).reduce((n, p) => n + statSync(join(ROOT, p)).size, 0))} B`);

// Every file in the tree, for the scans below. node_modules and .git are the
// only directories skipped.
function walk(dir = ROOT, prefix = '') {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true }).sort((a, b) => cmpU16(a.name, b.name))) {
    if (e.name === '.git' || e.name === 'node_modules') continue;
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...walk(join(dir, e.name), rel));
    else out.push(rel);
  }
  return out;
}
const allFiles = walk();

// No images, ever. One rival checks in 1,219 files and 258 MB of output it has
// no licence to; the other rehosts 182 from its own CDN.
const IMAGE_RE = /\.(png|jpe?g|gif|webp|avif|svg|bmp|tiff?|ico|mp4|mov|webm)$/i;
const images = allFiles.filter((p) => IMAGE_RE.test(p));
check('zero image or video files in the tree', images.length === 0, images.length ? images.slice(0, 5).join(', ') : `${allFiles.length} files scanned`);

// A generator that is gitignored is a generator that dies with the laptop it
// lives on. One rival's is untracked, and its loop stopped when its author left.
if (existsSync(join(ROOT, '.gitignore'))) {
  const patterns = readText('.gitignore')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
  const mustBeTracked = ['scripts/build.mjs', 'scripts/verify.mjs', 'data/prompts.json', 'data/prompts.schema.json', 'llms.txt.tmpl'];
  const hidden = mustBeTracked.filter((p) =>
    patterns.some((pat) => {
      const base = pat.replace(/^\/+|\/+$/g, '');
      return base && (p === base || p.startsWith(base + '/') || p.endsWith('/' + base) || (base.startsWith('*') && p.endsWith(base.slice(1))));
    }),
  );
  check('.gitignore hides nothing the build needs', hidden.length === 0, hidden.length ? hidden.join(', ') : `${patterns.length} pattern(s)`);
}

// ---------------------------------------------------------------------------
// 2. data/prompts.json against data/prompts.schema.json
//
// A hand-rolled validator over the draft 2020-12 subset this schema uses:
// type · const · enum · pattern · minLength · minimum · minItems · uniqueItems ·
// items · properties · required · additionalProperties · allOf · if/then/else.
// `format` and `description` are annotations and are not asserted.
// ---------------------------------------------------------------------------

console.log('\nschema');

function validate(value, node, path, errors) {
  if (node === true || node === undefined) return true;
  if (node === false) {
    errors.push(`${path}: schema forbids any value here`);
    return false;
  }
  const before = errors.length;

  if (node.type) {
    const types = Array.isArray(node.type) ? node.type : [node.type];
    const actual =
      value === null ? 'null' : Array.isArray(value) ? 'array' : Number.isInteger(value) ? 'integer' : typeof value;
    const ok = types.some((t) => t === actual || (t === 'number' && actual === 'integer'));
    if (!ok) errors.push(`${path}: expected ${types.join('|')}, got ${actual}`);
  }
  if ('const' in node && JSON.stringify(value) !== JSON.stringify(node.const)) {
    errors.push(`${path}: expected const ${JSON.stringify(node.const)}, got ${JSON.stringify(value)}`);
  }
  if (node.enum && !node.enum.some((e) => JSON.stringify(e) === JSON.stringify(value))) {
    errors.push(`${path}: ${JSON.stringify(value)} is not one of ${node.enum.map((e) => JSON.stringify(e)).join(', ')}`);
  }
  if (typeof value === 'string') {
    if (node.pattern && !new RegExp(node.pattern, 'u').test(value)) {
      errors.push(`${path}: ${JSON.stringify(value.slice(0, 60))} does not match /${node.pattern}/`);
    }
    if (node.minLength !== undefined && [...value].length < node.minLength) {
      errors.push(`${path}: shorter than minLength ${node.minLength}`);
    }
    if (node.maxLength !== undefined && [...value].length > node.maxLength) {
      errors.push(`${path}: longer than maxLength ${node.maxLength}`);
    }
  }
  if (typeof value === 'number') {
    if (node.minimum !== undefined && value < node.minimum) errors.push(`${path}: ${value} < minimum ${node.minimum}`);
    if (node.maximum !== undefined && value > node.maximum) errors.push(`${path}: ${value} > maximum ${node.maximum}`);
  }
  if (Array.isArray(value)) {
    if (node.minItems !== undefined && value.length < node.minItems) errors.push(`${path}: ${value.length} items < minItems ${node.minItems}`);
    if (node.uniqueItems) {
      const seen = new Set();
      value.forEach((v, i) => {
        const k = JSON.stringify(v);
        if (seen.has(k)) errors.push(`${path}/${i}: duplicate item under uniqueItems`);
        seen.add(k);
      });
    }
    if (node.items) value.forEach((v, i) => validate(v, node.items, `${path}/${i}`, errors));
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const k of node.required || []) if (!(k in value)) errors.push(`${path}: missing required property ${k}`);
    if (node.properties) {
      for (const [k, sub] of Object.entries(node.properties)) if (k in value) validate(value[k], sub, `${path}/${k}`, errors);
    }
    if (node.additionalProperties === false) {
      const known = new Set(Object.keys(node.properties || {}));
      for (const k of Object.keys(value)) if (!known.has(k)) errors.push(`${path}: additional property ${k} is not permitted`);
    } else if (node.additionalProperties && typeof node.additionalProperties === 'object') {
      const known = new Set(Object.keys(node.properties || {}));
      for (const k of Object.keys(value)) if (!known.has(k)) validate(value[k], node.additionalProperties, `${path}/${k}`, errors);
    }
  }
  for (const sub of node.allOf || []) validate(value, sub, path, errors);
  if (node.if) {
    const probe = [];
    validate(value, node.if, path, probe);
    const branch = probe.length === 0 ? node.then : node.else;
    if (branch) validate(value, branch, path, errors);
  }
  return errors.length === before;
}

const schemaErrors = [];
validate(doc, schema, '#', schemaErrors);
check('data/prompts.json validates against its schema', schemaErrors.length === 0, schemaErrors.length ? `${schemaErrors.length} error(s): ${schemaErrors.slice(0, 3).join(' | ')}` : `${doc.prompts.length} rows, ${Object.keys(meta).length} _meta keys`);

// data/removed.json's own shape. It must never carry prompt text or identity.
const removed = readJson('data/removed.json');
const removedErrors = [];
if (!Array.isArray(removed.removed)) removedErrors.push('removed is not an array');
for (const e of removed.removed || []) {
  if (!/^\d+$/.test(String(e.statusId ?? ''))) removedErrors.push(`${JSON.stringify(e)}: statusId must be digits`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(e.removed_at ?? ''))) removedErrors.push(`${e.statusId}: removed_at must be YYYY-MM-DD`);
  if (!String(e.basis ?? '').trim()) removedErrors.push(`${e.statusId}: basis is required`);
  if ('issue' in e && !Number.isInteger(e.issue)) removedErrors.push(`${e.statusId}: issue must be an integer`);
  for (const k of Object.keys(e)) if (!['statusId', 'removed_at', 'basis', 'issue'].includes(k)) removedErrors.push(`${e.statusId}: unexpected key ${k} — this file records no prompt text and no requester identity`);
}
check('data/removed.json entries are well formed', removedErrors.length === 0, removedErrors.length ? removedErrors.slice(0, 3).join(' | ') : `${(removed.removed || []).length} tombstone(s)`);

// Nothing tombstoned may still be published.
const tombstoned = new Set((removed.removed || []).map((e) => String(e.statusId)));
const stillPublished = doc.prompts.filter((r) => r.statusId && tombstoned.has(String(r.statusId)));
check('no tombstoned post is still in the corpus', stillPublished.length === 0, stillPublished.length ? stillPublished.map((r) => r.slug).join(', ') : `${tombstoned.size} checked against ${doc.prompts.length} rows`);

// ---------------------------------------------------------------------------
// 3. Locale files
// ---------------------------------------------------------------------------

console.log('\nlocales');

function flatten(obj, prefix = '', out = []) {
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
    else out.push([key, v]);
  }
  return out;
}
const flat = Object.fromEntries(LOCALES.map((l) => [l, new Map(flatten(readJson(`locales/${l}.json`)))]));
const enKeys = [...flat.en.keys()];
const contentKeys = enKeys.filter((k) => !k.startsWith('$meta.'));

const keyErrors = [];
for (const l of LOCALES) {
  const keys = [...flat[l].keys()];
  if (keys.length !== enKeys.length || keys.some((k, i) => k !== enKeys[i])) {
    const missing = enKeys.filter((k) => !flat[l].has(k));
    const extra = keys.filter((k) => !flat.en.has(k));
    keyErrors.push(`${l}: ${missing.length} missing (${missing.slice(0, 3).join(', ')}), ${extra.length} extra (${extra.slice(0, 3).join(', ')})`);
  }
}
check('all six locale files carry one identical key set', keyErrors.length === 0, keyErrors.length ? keyErrors.join(' | ') : `${enKeys.length} keys × ${LOCALES.length} locales, same order`);

const phSet = (s) => [...String(s).matchAll(/\{([^{}]*)\}/g)].map((m) => m[1]).sort(cmpU16).join(',');
const valueErrors = [];
for (const l of LOCALES) {
  for (const k of contentKeys) {
    const v = flat[l].get(k);
    if (typeof v !== 'string' || !v.trim()) valueErrors.push(`${l}.${k}: empty`);
    else {
      if (phSet(v) !== phSet(flat.en.get(k))) valueErrors.push(`${l}.${k}: placeholder set differs from en`);
      if (/\*\*|`|\|/.test(v)) valueErrors.push(`${l}.${k}: carries markdown; emphasis and links belong to the renderer`);
    }
  }
  const dir = flat[l].get('$meta.dir');
  if (dir !== (l === 'ar' ? 'rtl' : 'ltr')) valueErrors.push(`${l}: $meta.dir is ${dir}`);
  if (!String(flat[l].get('$meta.name') ?? '').trim()) valueErrors.push(`${l}: $meta.name is empty`);
  if (flat[l].get('$meta.locale') !== l) valueErrors.push(`${l}: $meta.locale is not ${l}`);
  if (!/^[0-9a-f]{64}$/.test(String(flat[l].get('$meta.sourceSha')))) valueErrors.push(`${l}: $meta.sourceSha is not a sha256`);
  if (!/^[0-9a-f]{40}$/.test(String(flat[l].get('$meta.sourceCommit')))) valueErrors.push(`${l}: $meta.sourceCommit is not a commit`);
}
check('locale values: non-empty, plain text, same placeholders', valueErrors.length === 0, valueErrors.length ? valueErrors.slice(0, 4).join(' | ') : `${LOCALES.length * contentKeys.length} values`);

// The Arabic rule. dir="auto" resolves from the first strong character and
// GitHub stamps nothing on <li>, so a Latin-initial or digit-initial Arabic
// string flips its whole list. `$meta` is exempt: it is machine metadata and is
// English by necessity.
const MD_MARKERS = new Set([' ', '\t', '-', '*', '+', '#', '>', '[', ']', '(', ')', '_', '`', '~', '!', '.', ':', '·', '\\', '"', "'", RLM]);
function needsRlm(line) {
  for (const ch of line) {
    if (ch === RLM) return false;
    if (MD_MARKERS.has(ch)) continue;
    return /[A-Za-z0-9<{]/.test(ch);
  }
  return false;
}
const arBad = contentKeys.filter((k) => needsRlm(String(flat.ar.get(k))));
check('ar values carry U+200F where the rule requires it', arBad.length === 0, arBad.length ? arBad.join(', ') : `${contentKeys.filter((k) => String(flat.ar.get(k)).startsWith(RLM)).length} of ${contentKeys.length} carry the mark`);

// ---------------------------------------------------------------------------
// 4. The generated link graph, re-parsed off disk
// ---------------------------------------------------------------------------

console.log('\nlinks');

/** Drop fenced blocks, tracking the opening fence so a longer one cannot end it. */
function stripFenced(text) {
  const out = [];
  let fence = null;
  for (const line of text.split('\n')) {
    const m = /^\s*(`{3,}|~{3,})/.exec(line);
    if (fence === null) {
      if (m) fence = m[1];
      else out.push(line);
    } else if (m && m[1][0] === fence[0] && m[1].length >= fence.length) {
      fence = null;
    }
  }
  return out.join('\n');
}

const markdownOutputs = OUTPUTS.filter((p) => p.endsWith('.md'));
const anchorsOf = new Map();
for (const p of [...markdownOutputs, 'llms.txt']) {
  const set = new Set();
  for (const m of readText(p).matchAll(/<a id="([^"]+)"><\/a>/g)) set.add(m[1]);
  anchorsOf.set(p, set);
}

const linkErrors = [];
let internalLinks = 0;
for (const p of [...markdownOutputs, 'llms.txt']) {
  const prose = stripFenced(readText(p));
  const targets = [
    ...[...prose.matchAll(/\]\(([^()\s]+)\)/g)].map((m) => m[1]),
    ...[...prose.matchAll(/<a href="([^"]+)"/g)].map((m) => m[1]),
  ];
  for (const target of targets) {
    if (/^(https?:|mailto:)/.test(target)) continue;
    internalLinks++;
    const [filePart, frag] = target.split('#');
    const abs = filePart === '' ? p : relative(ROOT, resolve(ROOT, dirname(p), filePart)).split('\\').join('/');
    if (!existsSync(join(ROOT, abs))) {
      linkErrors.push(`${p} -> ${target} (no such file)`);
      continue;
    }
    if (!frag) continue;
    const set = anchorsOf.get(abs) ?? new Set([...readText(abs).matchAll(/<a id="([^"]+)"><\/a>/g)].map((m) => m[1]));
    if (!set.has(frag)) linkErrors.push(`${p} -> ${target} (target emits no <a id="${frag}">)`);
  }
}
check('every internal link and fragment resolves', linkErrors.length === 0, linkErrors.length ? linkErrors.slice(0, 4).join(' | ') : `${internalLinks} internal links across ${markdownOutputs.length + 1} files`);

// Anchor ids must be legal and unique within their file, so a fragment cannot be
// ambiguous. GitHub rewrites id="x" to id="user-content-x"; a duplicate id is
// two elements answering one fragment.
const ID_RE = /^[a-z0-9][a-z0-9-]{0,79}$/;
const idErrors = [];
let idCount = 0;
for (const [p, set] of anchorsOf) {
  const raw = [...readText(p).matchAll(/<a id="([^"]+)"><\/a>/g)].map((m) => m[1]);
  idCount += raw.length;
  if (raw.length !== set.size) idErrors.push(`${p}: ${raw.length - set.size} duplicate id(s)`);
  for (const id of set) if (!ID_RE.test(id)) idErrors.push(`${p}: illegal id ${JSON.stringify(id)}`);
}
check('every anchor id is legal and unique in its file', idErrors.length === 0, idErrors.length ? idErrors.slice(0, 3).join(' | ') : `${idCount} anchors`);

// Every youart.ai URL carries the full UTM set, except the two canonical
// citation-shaped addresses that get copied into other people's files.
const UNTAGGED_ALLOWED = new Set([meta.siteBase, `${meta.siteBase.replace(/^(https:\/\/[^/]+).*$/, '$1')}/llms.txt`]);
const utmErrors = [];
let taggedCount = 0;
let untaggedByDesign = 0;
for (const p of [...markdownOutputs, 'llms.txt', 'metadata/about.txt', 'metadata/homepage.txt'].filter((f) => existsSync(join(ROOT, f)))) {
  const body = readText(p);
  for (const m of body.matchAll(/https:\/\/youart\.ai[^\s)"'\]<>]*/g)) {
    const url = m[0];
    // Exempt only where the citation-shaped address is NOT a link target;
    // `](…)` is a click, and a click carries its UTM.
    const asLinkTarget = body.slice(Math.max(0, m.index - 2), m.index) === '](';
    if (!asLinkTarget && UNTAGGED_ALLOWED.has(url)) {
      untaggedByDesign++;
      continue;
    }
    taggedCount++;
    const q = url.split('?')[1]?.split('#')[0] ?? '';
    const params = Object.fromEntries(q.split('&').filter(Boolean).map((kv) => kv.split('=')));
    for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']) {
      if (!params[k]) utmErrors.push(`${p}: ${url} has no ${k}`);
    }
    if (params.utm_campaign && params.utm_campaign !== 'awesome-gpt-image-2-5-prompts') {
      utmErrors.push(`${p}: ${url} carries campaign ${params.utm_campaign}`);
    }
    // The fragment must come after the query string, never before it.
    if (url.includes('#') && url.indexOf('#') < url.indexOf('?')) utmErrors.push(`${p}: ${url} puts the fragment before the query`);
  }
}
check('every youart.ai URL is fully tagged', utmErrors.length === 0, utmErrors.length ? utmErrors.slice(0, 3).join(' | ') : `${taggedCount} tagged, ${untaggedByDesign} canonical by design and none of them a link target`);

// The five translated READMEs must point at a locale-prefixed path; en must not.
const localeUrlErrors = [];
for (const l of LOCALES) {
  const text = readText(readmePath(l));
  const urls = [...text.matchAll(/https:\/\/youart\.ai(\/[a-z]{2})?\/(gpt-image-2-5-prompts|\?)/g)].map((m) => m[1] ?? '');
  const wrong = urls.filter((prefix) => prefix !== (l === 'en' ? '' : `/${l}`));
  if (wrong.length) localeUrlErrors.push(`${readmePath(l)}: ${wrong.length} link(s) to ${[...new Set(wrong)].join(',') || 'the unprefixed path'}`);
}
check('each README links to its own locale of the destination', localeUrlErrors.length === 0, localeUrlErrors.length ? localeUrlErrors.join(' | ') : `${LOCALES.length} READMEs`);

// ---------------------------------------------------------------------------
// 5. build.mjs is pure
// ---------------------------------------------------------------------------

console.log('\nbuild.mjs purity');

/** Strip comments so an explanatory line cannot trip the scan. `://` is spared. */
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((line) => {
      const i = line.search(/(^|[^:])\/\//);
      if (i === -1) return line;
      return line.slice(0, line.indexOf('//', i));
    })
    .join('\n');
}
const buildSrc = stripComments(readText('scripts/build.mjs'));
const BANNED = ['new Date', 'Date.now', 'Math.random', 'fetch(', 'node:http', 'node:https', 'node:child_process', 'process.env', 'toLocaleString', 'localeCompare', 'hrtime', 'performance.now'];
const found = BANNED.filter((needle) => buildSrc.includes(needle));
check('build.mjs reads no clock, network, env or ICU locale', found.length === 0, found.length ? found.join(', ') : `${BANNED.length} patterns absent from ${num(buildSrc.split('\n').length)} lines of code`);
// build.mjs is the only writer in the repository, so this file must not even
// import a way to write. Only the `node:fs` import specifier list is inspected,
// not the whole source, or the names below would match themselves.
const fsImport = /import\s*\{([^}]*)\}\s*from\s*'node:fs'/.exec(readText('scripts/verify.mjs'))?.[1] ?? '';
const imported = fsImport.split(',').map((x) => x.trim()).filter(Boolean);
const WRITERS = ['writeFileSync', 'appendFileSync', 'rmSync', 'unlinkSync', 'mkdirSync', 'renameSync', 'cpSync', 'rmdirSync', 'writeFile', 'createWriteStream'];
const writeImports = imported.filter((n) => WRITERS.includes(n));
check('verify.mjs imports no way to write', writeImports.length === 0, writeImports.length ? writeImports.join(', ') : `node:fs → ${imported.join(', ')}`);

// ---------------------------------------------------------------------------
// 6. Hand-written prose carries no hand-typed count
//
// Both rival repositories publish a hand-maintained count in prose, and both are
// wrong today. "GPT Image 2.5 prompts" is stripped first: it contains the string
// "5 prompts" and is a product name, not a count.
// ---------------------------------------------------------------------------

console.log('\nhand-written prose');

const GENERATED = new Set(OUTPUTS);
const handWritten = allFiles.filter(
  (p) => /\.(md|txt|tmpl)$/.test(p) && !GENERATED.has(p) && !p.startsWith('node_modules/'),
);
const COUNT_RE = /\b\d[\d,]*\s+(prompts|authors|cases|categories|creators|rows|files)\b/i;
const countOffenders = [];
for (const p of handWritten) {
  const prose = stripFenced(readText(p))
    .split(/GPT Image \d(?:\.\d)?/)
    .join('')
    .replace(/\{\{[A-Z0-9_]*\}\}/g, ''); // a placeholder is a computed count, not a typed one
  const m = COUNT_RE.exec(prose);
  if (m) countOffenders.push(`${p}: "${m[0]}"`);
}
check('no hand-written file states a count in prose', countOffenders.length === 0, countOffenders.length ? countOffenders.slice(0, 3).join(' | ') : `${handWritten.length} hand-written file(s) scanned`);

// ---------------------------------------------------------------------------
// 7. metadata/
// ---------------------------------------------------------------------------

console.log('\nmetadata');

const about = readText('metadata/about.txt').trim();
check('metadata/about.txt is one line under 156 chars', about.length <= 155 && !about.includes('\n'), `${about.length} chars`);
check('metadata/about.txt holds no unrendered placeholder', !about.includes('{{'), about.includes('{{') ? 'still a template' : 'fully substituted');

if (existsSync(join(ROOT, 'metadata/homepage.txt'))) {
  const homepage = readText('metadata/homepage.txt').trim();
  const ok =
    homepage.startsWith(meta.siteBase + '?') &&
    homepage.includes('utm_source=github') &&
    homepage.includes('utm_medium=about') &&
    homepage.includes('utm_campaign=awesome-gpt-image-2-5-prompts') &&
    homepage.includes('utm_content=homepage') &&
    !homepage.includes('\n');
  check("metadata/homepage.txt is the repo's tagged About URL", ok, homepage.slice(0, 60) + '…');
}
if (existsSync(join(ROOT, 'metadata/topics.txt'))) {
  const topics = readText('metadata/topics.txt').trim().split('\n');
  const badTopics = topics.filter((t) => !/^[a-z0-9][a-z0-9-]{0,34}$/.test(t));
  check('metadata/topics.txt holds only legal GitHub topics', badTopics.length === 0 && topics.length <= 20, badTopics.length ? badTopics.join(', ') : `${topics.length} topics`);
}

// ---------------------------------------------------------------------------

console.log(
  `\n${checks} checks · ${failed} failed.` +
    (failed ? '' : ' Run `node scripts/build.mjs --check` next; together they are the whole of CI.'),
);
process.exit(failed ? 1 : 0);
