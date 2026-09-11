#!/usr/bin/env node
//
// scripts/build.mjs — THE ONLY WRITER IN THIS REPOSITORY.
//
//   inputs   data/prompts.json · data/prompts.schema.json · data/removed.json
//            locales/{en,zh,es,ja,ar,pt}.json
//            content/[0-9][0-9]-*.md   (English README prose, per content/PLACEHOLDERS.txt)
//            llms.txt.tmpl · metadata/about.txt
//   outputs  README.md · README.{zh,es,ja,ar,pt}.md
//            prompts/gpt-image-2-5-<use-case>-prompts.md × 9
//            llms.txt · metadata/about.txt
//
// DETERMINISM IS A HARD REQUIREMENT. A rebuild on unchanged input must produce
// byte-identical output, on any machine, forever. Guaranteed by construction:
//
//   * no clock. Every date printed comes from `_meta.corpusDate`, which the
//     exporter carries forward while the corpus hash is unchanged. There is no
//     clock read and no mtime read anywhere in this file, and scripts/verify.mjs
//     greps the source for the ways to do it. `Date.UTC(2026, 8, 8)` appears
//     once: it is a pure function of three literals, a compile-time constant in
//     everything but name, and it is compared against a timestamp decoded from
//     a committed X status id.
//   * no randomness, no network, no subprocess, no environment. `process.argv`,
//     `process.stdout` and `process.exit` are the only host surfaces touched.
//   * no locale-dependent primitives. Every sort uses `cmpU16` (UTF-16 code
//     unit); `localeCompare` and `toLocaleString` are never called, because both
//     change answer with the machine's ICU build.
//   * every iteration is over an explicitly ordered array — `_meta.categories`
//     for categories, `LOCALES` for locales, a sorted list everywhere else.
//   * files are written UTF-8, LF, no BOM, with a trailing newline.
//
// The reason this matters is measurable: a rival repository runs a twice-daily
// job that rewrites sixteen READMEs whose only changed line is a timestamp, and
// has accrued roughly 196 MB of git history over a 17 MB working tree. A build
// with a clock in it commits noise forever.
//
// Modes
//   node scripts/build.mjs            render, check every invariant, then write
//   node scripts/build.mjs --check    render and compare; write nothing; exit 1
//                                     naming every stale, missing or extra file
//   node scripts/build.mjs --restamp  recompute the derived fields in
//                                     data/prompts.json (counts, corpusSha256,
//                                     row order) and then build. THE SUPPORTED
//                                     PATH FOR HONOURING A TAKEDOWN: delete the
//                                     record, tombstone its status id, --restamp.
//
// Fragments: GitHub rewrites `id="x"` to `id="user-content-x"` and resolves the
// bare `#x` with a client script. So an `#x` fragment works for a human on
// github.com and NOWHERE ELSE — not with JS off, not in another markdown
// renderer, not on raw.githubusercontent.com, which serves text/plain. The
// fragment is a convenience. The citation mechanism is the absolute URL on every
// row of data/prompts.json and the Run link beside every prompt body. Nobody
// should re-derive the false claim that the id you write is the id you link.
//
// LICENCE PASS DEFERRED. This draft renders no rights section, no per-row terms
// verdict and no licence column. The DATA carries provenance — author, author
// URL, source post, upstream repo and `upstreamStatedTerms` — because that is a
// factual record of what we received. Rendering rights is a separate pass; the
// place it will go carries one TODO line, which arrives inside the content
// fragments and inside llms.txt.tmpl and must survive verbatim.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

// ---------------------------------------------------------------------------
// Decisions. Everything here is a choice; nothing here is a measurement.
// Measurements are computed from the data, below, and never typed.
// ---------------------------------------------------------------------------

const REPO_OWNER = 'youart-open-source';
const REPO_NAME = 'awesome-gpt-image-2-5-prompts';
const REPO_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}`;
const RAW_BASE = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main`;
const UTM_CAMPAIGN = REPO_NAME;

const LOCALES = ['en', 'zh', 'es', 'ja', 'ar', 'pt'];
const RLM = '\u200F';

// The blob-URL stem per category. An SEO decision about the file path, not a
// property of the corpus, which is why it lives here and not in the data. Two
// stems deliberately differ from the category id — `typography-text` ships as
// `text-in-image`, `ecommerce-product` as `product-photo` — because those are
// the phrases people search. Checked against `_meta.categories` both ways.
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

// Examples reproduced from YouArt's GPT Image 2.5 prompts page. Keep these local
// so the README remains useful in forks and archives instead of depending on a
// CDN. Rights remain with their respective creators; see images/README.md.
const EXAMPLE_IMAGE = {
  poster: ['poster.webp', 'GPT Image 2.5 typography poster example generated on YouArt'],
  'typography-text': ['poster.webp', 'GPT Image 2.5 typography and in-image text example generated on YouArt'],
  infographic: ['infographic.webp', 'GPT Image 2.5 infographic example generated on YouArt'],
  'ui-mockup': ['storyboard.webp', 'GPT Image 2.5 multi-panel interface and storyboard layout example generated on YouArt'],
  'ecommerce-product': ['product.webp', 'GPT Image 2.5 product photography example generated on YouArt'],
  'ad-creative': ['product.webp', 'GPT Image 2.5 advertising creative example generated on YouArt'],
  'character-design': ['character-sheet.webp', 'GPT Image 2.5 character design sheet example generated on YouArt'],
  portrait: ['portrait.webp', 'GPT Image 2.5 photorealistic portrait example generated on YouArt'],
  illustration: ['travel.webp', 'GPT Image 2.5 cinematic illustration example generated on YouArt'],
};

// Section anchor ids are FIXED ENGLISH STRINGS in all six files. A translated
// heading has a different GitHub slug, so a repository that lets GitHub generate
// the target ships one dead link per section per translation — measured at 135
// in a rival. `## الحقوق` still answers to `#rights` here because we emit the id.
const SECTION_IDS = ['what', 'how', 'browse', 'guide', 'json', 'index', 'faq', 'rights', 'machines', 'cta', 'about'];

// Prompt anchors are `p-{slug}`, never a bare `{slug}`. For the 105 titles whose
// slug already equals the slug GitHub would generate for the heading beside it,
// a bare `<a id="{slug}">` puts two elements with id="user-content-{slug}" on
// one page. The prefix removes all 105 collisions at zero cost.
const PROMPT_ANCHOR_PREFIX = 'p-';
const CATEGORY_ANCHOR_PREFIX = 'cat-';
const ID_RE = /^[a-z0-9][a-z0-9-]{0,79}$/;

// Byte guards. 120,000 is HEADROOM, NOT THE CLIFF: GitHub was verified inlining
// READMEs at 68,405 / 74,401 / 87,682 B and verified NOT inlining at 327,044 /
// 373,298 / 1,121,931 B, so the real threshold sits in (130,776, 189,693] and has
// never been bisected. Do not raise this on the strength of "it still inlined".
const BUDGET = {
  readmeDegrade: 108_000,
  readmeFail: 120_000,
  promptFile: 150_000,
  promptsJson: 500_000,
  aboutChars: 155,
};

// The rights section is deliberately absent from this draft. This exact line
// stands where it will go. It arrives inside content/20-guide.md and inside
// llms.txt.tmpl; build.mjs emits it itself in the five translated READMEs,
// which have no fragment.

// content/ holds the hand-written English prose. Two shapes are accepted, and
// which one a file uses is decided by where it sits:
//
//   content/readme/<section>[.<locale>].md   APPENDED after that section's
//                                            locale-driven body. `.md` with no
//                                            locale suffix means English.
//   content/NN-<name>.md                     REPLACES that section's body in
//                                            README.md, English only. It must
//                                            open with an HTML comment whose
//                                            header declares `section: <id>`.
//
// Either way an `.txt` under content/ is documentation and is never published,
// and a path that matches neither shape FAILS THE BUILD rather than being
// silently ignored — a fragment somebody wrote must never vanish quietly.
const FRAGMENT_FLAT_RE = /^\d\d-[a-z0-9-]+\.md$/;
const FRAGMENT_SECTION_RE = /^([a-z0-9-]+?)(?:\.([a-z]{2}))?\.md$/;

// metadata/about.txt is BOTH the hand-written template and the generated file.
// While it still holds `{{`, that copy is the template and the build renders it
// in place; from then on this constant — byte-identical to what the metadata
// author wrote — is the template, so the counts inside it keep regenerating and
// cannot freeze. Change the wording here, not in the generated file.
const ABOUT_TMPL_DEFAULT =
  'GPT Image 2.5 prompts, verbatim and credited: {{PROMPT_COUNT}} community prompts across ' +
  '{{CATEGORY_COUNT}} use cases, each with the author who wrote it and their post. Free to run.';

// A short, practical note: a contributor who hand-edits a built file loses the
// work on the next build, so they need to know where to edit instead. It says
// nothing about how the collection was put together, which is not the reader's
// problem and not what this comment is for.
const GENERATED_BANNER = (sources) =>
  `<!-- Built from ${sources} by \`node scripts/build.mjs\`.\n` +
  `     Edit the source, not this file; \`--check\` fails CI on a hand edit. -->`;

// ---------------------------------------------------------------------------
// Deterministic primitives
// ---------------------------------------------------------------------------

/**
 * A failure the build is designed to produce: a bad placeholder, a missing
 * locale key, an illegal anchor. It is reported as a build failure rather than
 * as a crash, because the message already names the file and the fix.
 */
class BuildError extends Error {}

// One of those reads as a build failure; anything else is a real crash and keeps
// its stack. Either way the process exits non-zero having written nothing.
process.on('uncaughtException', (e) => {
  console.error(`\nbuild aborted; NOTHING WAS WRITTEN.\n${e instanceof BuildError ? e.message : e.stack}`);
  process.exit(1);
});

/** UTF-16 code-unit comparison. The only ordering primitive in this file. */
const cmpU16 = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const byKey = (f) => (a, b) => cmpU16(f(a), f(b));

const sha256 = (s) => createHash('sha256').update(s, 'utf8').digest('hex');
const bytes = (s) => Buffer.byteLength(s, 'utf8');

/** Thousands grouping from four digits up. `toLocaleString` reads the host ICU. */
const num = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const readText = (rel) => readFileSync(join(ROOT, rel), 'utf8');
const readJson = (rel) => JSON.parse(readText(rel));
const fileBytes = (rel) => bytes(readText(rel));

/** Numeric median, rounded, exactly as content/PLACEHOLDERS.txt defines it. */
function median(xs) {
  const s = [...xs].sort((a, b) => a - b);
  const n = s.length;
  return Math.round((s[(n - 1) >> 1] + s[n >> 1]) / 2);
}

// ---------------------------------------------------------------------------
// Markdown escaping.
//
// Prompt BODIES go inside fenced code blocks and are never escaped — escaping
// would stop them being verbatim, which is the whole posture. Anything that
// lands in a TABLE CELL or in link text goes through esc()/cell() instead. The
// corpus measurably carries 3 pipes, 2 '<', 8 '>' and 168 `{argument name=}`
// tokens, and 88 of 150 bodies contain a newline, every one of which would break
// a table row. selfTestEscaping() runs both functions over all 150 bodies and
// all 150 titles on every build and asserts the result is safe; see the
// "escaping self-test" block in the build output.
// ---------------------------------------------------------------------------

const ESCAPABLE = new Set(['\\', '`', '*', '_', '[', ']', '<', '>', '|', '~', '&']);

/** Escape plain text for inline markdown: link text, list item, table cell. */
function esc(s) {
  let out = '';
  for (const ch of String(s)) out += ESCAPABLE.has(ch) ? '\\' + ch : ch;
  return out;
}

/** Escape plain text for a GFM table cell: no newline may survive. */
const cell = (s) => esc(String(s).replace(/\s+/g, ' ').trim());

/**
 * The fence for a verbatim body: one backtick longer than the longest backtick
 * run inside it, minimum three. The corpus has zero backticks today; this exists
 * so that the day one arrives the build does not silently emit a broken block.
 */
function fenceFor(body) {
  let longest = 0;
  for (const run of body.match(/`+/g) || []) longest = Math.max(longest, run.length);
  return '`'.repeat(Math.max(3, longest + 1));
}
function codeBlock(body, lang) {
  const f = fenceFor(body);
  return `${f}${lang}\n${body.endsWith('\n') ? body : body + '\n'}${f}`;
}

/**
 * Drop every fenced block from a rendered document, tracking the opening fence
 * so a longer fence inside a block cannot end it early. Any scan of OUR prose
 * must run on this and not on the raw file: the verbatim bodies are third-party
 * text and say whatever their authors wrote. One of them describes a "license
 * plate reading HEISENBRG", which is exactly the sort of word a naive rights
 * scan trips on — and treating a prompt body as a claim by us is the category
 * error this whole repository is arranged to avoid.
 */
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

// ---------------------------------------------------------------------------
// Right-to-left guard.
//
// GitHub stamps dir="auto" on markdown-generated <p>, <h*>, <ul> and <ol> but
// stamps NOTHING on <li> (0 of 88 measured). dir="auto" resolves from the first
// strong character, so ONE Latin-initial list item sets the direction for its
// whole list. Any emitted Arabic line whose first strong character is Latin, a
// digit, '<' or '{' gets a U+200F in front. The same test then runs as an
// assertion over the finished README.ar.md.
// ---------------------------------------------------------------------------

const MD_MARKERS = new Set([' ', '\t', '-', '*', '+', '#', '>', '[', ']', '(', ')', '_', '`', '~', '!', '.', ':', '·', '\\', '"', "'", RLM]);
const LTR_INITIAL = /[A-Za-z0-9<{]/;

/** True when this string would flip an Arabic block to LTR. */
function needsRlm(line) {
  for (const ch of line) {
    if (ch === RLM) return false;
    if (MD_MARKERS.has(ch)) continue;
    return LTR_INITIAL.test(ch);
  }
  return false;
}
const rlmGuard = (locale, line) => (locale === 'ar' && needsRlm(line) ? RLM + line : line);

// ---------------------------------------------------------------------------
// Placeholder substitution. Two disjoint syntaxes, deliberately.
//
//   {name}    in locale VALUES only. Nine names, all computed from the data.
//             fmt() throws on an unknown name and on any brace it did not
//             resolve, so a translator who invents {promptCount} fails the build
//             rather than shipping a literal brace to a reader.
//   {{NAME}}  in TEMPLATE files: content/*.md, llms.txt.tmpl, metadata/about.txt.
//             An unknown name is a BUILD FAILURE naming the file, the
//             placeholder and every name that does exist. Never a pass-through.
//
// Both are SINGLE PASS with a replacer function, so a substituted value is never
// rescanned. That matters: 14 prompt bodies contain `{{` (nested JSON) and 56
// carry `{argument name=…}` tokens their authors wrote. Neither may ever be read
// as one of ours, and neither is ever fed to a substituter in the first place —
// a body reaches the page only inside a fenced block.
// ---------------------------------------------------------------------------

function fmt(str, vars, where) {
  return str.replace(/\{([^{}]*)\}/g, (_m, name) => {
    if (!Object.prototype.hasOwnProperty.call(vars, name)) {
      throw new BuildError(`unresolved placeholder {${name}} in ${where}; available: ${Object.keys(vars).sort(cmpU16).join(', ')}`);
    }
    return String(vars[name]);
  });
}

const templateUses = new Map(); // NAME -> files that used it, for the unused-name note

function fillTemplate(str, vars, where) {
  return str.replace(/\{\{([A-Z][A-Z0-9_]*)\}\}/g, (_m, name) => {
    if (!Object.prototype.hasOwnProperty.call(vars, name) || vars[name] === null) {
      throw new BuildError(
        `unimplemented template placeholder {{${name}}} in ${where}.\n` +
          `  build.mjs implements: ${Object.keys(vars).filter((k) => vars[k] !== null).sort(cmpU16).join(', ')}\n` +
          `  An unimplemented placeholder is a build failure, never a pass-through.`,
      );
    }
    if (!templateUses.has(name)) templateUses.set(name, new Set());
    templateUses.get(name).add(where);
    return String(vars[name]);
  });
}

// ---------------------------------------------------------------------------
// Destination URLs. EVERY outbound youart.ai link in a generated file is built
// here and recorded, and the record is asserted against a scan of the finished
// output. That makes two measured rival bugs unrepresentable: 601 destination
// links byte-identical across 11 locale files, so a German reader lands on the
// English page; and 80 links per file still carrying the campaign name from the
// repository's PREVIOUS name — 800 mis-attributed referrals.
// ---------------------------------------------------------------------------

const emittedDestinations = new Set();

function makeDestination(siteBase) {
  const m = /^(https:\/\/[^/]+)(\/.*)$/.exec(siteBase);
  if (!m) throw new BuildError(`_meta.siteBase is not an https URL with a path: ${siteBase}`);
  const [, origin, path] = m;
  const fn = function destination({ locale, source = 'github', medium, content, hash = null, root = false }) {
    if (!LOCALES.includes(locale)) throw new BuildError(`unknown locale ${locale}`);
    for (const [k, v] of [['medium', medium], ['content', content], ['source', source]]) {
      if (!/^[a-z0-9][a-z0-9-]*$/.test(String(v))) throw new BuildError(`bad utm_${k}: ${v}`);
    }
    const prefix = locale === 'en' ? '' : `/${locale}`; // en is unprefixed: /en/… costs a 307 hop
    const base = root ? `${origin}${prefix}/` : `${origin}${prefix}${path}`;
    // The fragment goes AFTER the query string, always.
    const url =
      `${base}?utm_source=${source}&utm_medium=${medium}&utm_campaign=${UTM_CAMPAIGN}&utm_content=${content}` +
      (hash ? `#${hash}` : '');
    emittedDestinations.add(url);
    return url;
  };
  fn.origin = origin;
  return fn;
}

// ---------------------------------------------------------------------------
// Document builder. Each file records the anchors it emitted and the internal
// links it built, so the link graph is validated against WHAT THE RENDERERS
// PRODUCED rather than a regex over generated markdown. A rival's
// regex-over-markdown check scanned inside fenced prompt bodies, and one
// community prompt containing `](brief.md#hero)` killed its publish in seven
// files with an error naming a file nobody wrote.
// ---------------------------------------------------------------------------

class Doc {
  constructor(path, locale) {
    this.path = path;
    this.locale = locale;
    this.blocks = [];
    this.anchors = new Set();
    this.links = [];
  }
  block(s) {
    if (s === null || s === undefined) return;
    const t = String(s);
    if (t.length) this.blocks.push(t);
  }
  /** Emit an explicit anchor. Never rely on a GitHub-generated heading slug. */
  anchor(id) {
    if (!ID_RE.test(id)) throw new BuildError(`${this.path}: illegal anchor id ${JSON.stringify(id)}`);
    if (this.anchors.has(id)) throw new BuildError(`${this.path}: duplicate anchor id ${id}`);
    this.anchors.add(id);
    this.block(`<a id="${id}"></a>`);
  }
  /** An in-repository link, recorded for the link-graph invariant. */
  rel(target, text) {
    this.links.push({ from: this.path, target });
    return `[${text}](${target})`;
  }
  li(content) {
    return `- ${rlmGuard(this.locale, content)}`;
  }
  list(items) {
    return items.map((i) => this.li(i)).join('\n');
  }
  text() {
    return this.blocks.join('\n\n') + '\n';
  }
}

// ---------------------------------------------------------------------------
// Mode, and the invariant reporter
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2);
for (const a of argv) {
  if (!['--check', '--restamp'].includes(a)) {
    console.error(`unknown argument ${a}; expected --check or --restamp`);
    process.exit(2);
  }
}
const MODE = argv.includes('--check') ? 'check' : argv.includes('--restamp') ? 'restamp' : 'build';

const failures = [];
let checkCount = 0;
function check(label, ok, measured) {
  checkCount++;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label.padEnd(54, '.')} ${measured}`);
  if (!ok) failures.push(`${label}: ${measured}`);
}
function hard(label, ok, measured) {
  check(label, ok, measured);
  if (!ok) {
    console.error('\nbuild aborted; NOTHING WAS WRITTEN.');
    process.exit(1);
  }
}
/**
 * A check over a DERIVED field of `_meta` — one that `--restamp` exists to
 * rewrite. Hard in every other mode; reported and skipped under `--restamp`,
 * because otherwise the guard that catches a hand edit also blocks the only
 * supported way to honour a takedown, and "removal is a one-line delete" would
 * be false.
 */
function derived(label, ok, measured) {
  if (MODE === 'restamp') {
    checkCount++;
    console.log(`  ${ok ? 'ok  ' : 'stamp'} ${label.padEnd(ok ? 54 : 53, '.')} ${ok ? measured : 'will be recomputed by --restamp'}`);
    return;
  }
  hard(label, ok, measured);
}

console.log(`awesome-gpt-image-2-5-prompts build (mode: ${MODE})\n`);

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

console.log('inputs');

const schema = readJson('data/prompts.schema.json');
// Three different questions, three different lists, all read from the schema.
//   ROW_KEYS      what every row MUST carry -> the missing-key check and the hash projection.
//   ALLOWED_KEYS  what a row MAY carry      -> the unexpected-key check and the restamp
//                                              projection. Conflating this with ROW_KEYS
//                                              silently DELETED optional fields on every
//                                              --restamp, which would have erased the CC BY
//                                              attribution the moment we honoured a takedown.
const ROW_KEYS = schema.properties?.prompts?.items?.required;
const ALLOWED_KEYS = Object.keys(schema.properties?.prompts?.items?.properties ?? {});
if (!Array.isArray(ROW_KEYS) || !ROW_KEYS.length) {
  console.error('data/prompts.schema.json declares no #/properties/prompts/items/required');
  process.exit(1);
}
if (!ALLOWED_KEYS.length) {
  console.error('data/prompts.schema.json declares no #/properties/prompts/items/properties');
  process.exit(1);
}
const document_ = readJson('data/prompts.json');
const meta = document_._meta;
const removedDoc = readJson('data/removed.json');
const localeData = Object.fromEntries(LOCALES.map((l) => [l, readJson(`locales/${l}.json`)]));

console.log(`  data/prompts.json            ${num(fileBytes('data/prompts.json'))} B`);
console.log(`  data/prompts.schema.json     ${num(fileBytes('data/prompts.schema.json'))} B`);
console.log(`  data/removed.json            ${num(fileBytes('data/removed.json'))} B`);
console.log(`  locales/*.json               ${LOCALES.length} files, ${num(LOCALES.reduce((n, l) => n + fileBytes(`locales/${l}.json`), 0))} B`);
console.log(`  row shape                    ${ROW_KEYS.length} required + ${ALLOWED_KEYS.length - ROW_KEYS.length} optional key(s), read from the schema`);

// --- the removal filter, applied BEFORE anything else ----------------------
//
// Keyed on the X status id and nothing else, because our slug derives from an
// editable upstream title and the sourceUrl is usually the thing being
// corrected, so either would stop matching and the row would come back on the
// next refresh from upstream. One status id can match more than one row (149
// sourced rows, 144 distinct posts): a tombstone removes every row of that post,
// because the request is about the post.

const tombstones = new Map();
for (const entry of removedDoc.removed || []) {
  const id = String(entry.statusId ?? '');
  if (!/^\d+$/.test(id)) {
    console.error(`data/removed.json: entry without a digit-only statusId: ${JSON.stringify(entry)}`);
    process.exit(1);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(entry.removed_at ?? ''))) {
    console.error(`data/removed.json: ${id} has no YYYY-MM-DD removed_at`);
    process.exit(1);
  }
  if (!String(entry.basis ?? '').trim()) {
    console.error(`data/removed.json: ${id} has no basis`);
    process.exit(1);
  }
  tombstones.set(id, entry);
}

const allRows = document_.prompts;
const rows = allRows.filter((r) => !(r.statusId && tombstones.has(String(r.statusId))));
const droppedByTombstone = allRows.length - rows.length;
console.log(`  data/removed.json filter     ${tombstones.size} tombstone(s), ${droppedByTombstone} row(s) dropped before selection`);

// ---------------------------------------------------------------------------
// Derived measurements. NOTHING below this line is a hand-typed count. Both
// rival repositories publish hand-maintained counts, and both are wrong today —
// one by 15.9x, one by 2x.
// ---------------------------------------------------------------------------

const categories = meta.categories;
const catIndex = new Map(categories.map((c, i) => [c, i]));
const rowsByCategory = new Map(categories.map((c) => [c, []]));
for (const r of rows) if (rowsByCategory.has(r.category)) rowsByCategory.get(r.category).push(r);
for (const list of rowsByCategory.values()) list.sort(byKey((r) => r.slug));

const inRenderOrder = (list) =>
  [...list].sort((a, b) => catIndex.get(a.category) - catIndex.get(b.category) || cmpU16(a.slug, b.slug));
const sortedRows = inRenderOrder(rows);

/** Unicode code points, the unit `_meta.totalPromptChars` uses. NOT .length. */
const chars = (r) => [...r.prompt].length;
const lines = (r) => r.prompt.split('\n').length;

const authorSet = new Set(rows.map((r) => r.author.toLowerCase()));
const jsonRows = rows.filter((r) => r.isJson);
const proseRows = rows.filter((r) => !r.isJson);
const sourcedRows = rows.filter((r) => r.statusId);
const totalPromptChars = rows.reduce((n, r) => n + chars(r), 0);

// Longest / shortest quarter: sort by chars DESCENDING, ties by slug ascending.
const byLength = [...rows].sort((a, b) => chars(b) - chars(a) || cmpU16(a.slug, b.slug));
const QUARTER = Math.ceil(rows.length / 4);
const longestQuarter = byLength.slice(0, QUARTER);
const shortestQuarter = byLength.slice(-QUARTER);

// Every regex below is used WITHOUT /g. A /g regex's .test() carries lastIndex
// between calls and silently undercounts; that bug cost ten rows while these
// numbers were first measured.
const RE_QUOTED = /"[^"\n]{1,200}"|“[^”\n]{1,200}”|「[^」\n]{1,200}」/;
const RE_CAMERA = /\b(\d{2}mm|focal length|shot on|f\/\d|aperture|depth of field|low[- ]angle|eye[- ]level|telephoto|macro lens|bokeh|camera angle)\b/i;
const RE_EXCLUSION = /(?:^|[\n.;:,]\s*)(?:no |without |avoid|do not |don't |never |exclude)/i;
const RE_FORMAT = /\b\d{1,2}\s*:\s*\d{1,2}\b|\baspect ratio\b|\bA4\b/i;
const RE_HEX = /#[0-9A-Fa-f]{6}\b/;
const RE_BRACKET_TOKEN = /\[[A-Z][A-Z0-9 _/-]{2,40}\]/;
const TEMPLATE_TOKEN = '{argument name=';

const cameraRows = rows.filter((r) => RE_CAMERA.test(r.prompt));
let cameraTop = null;
for (const c of categories) {
  const list = rowsByCategory.get(c);
  if (!list.length) continue;
  const hit = list.filter((r) => RE_CAMERA.test(r.prompt)).length;
  const share = hit / list.length;
  if (!cameraTop || share > cameraTop.share) cameraTop = { category: c, hit, total: list.length, share };
}

const templateTokenRows = rows.filter((r) => r.prompt.includes(TEMPLATE_TOKEN));
const templateTokenCount = rows.reduce((n, r) => n + r.prompt.split(TEMPLATE_TOKEN).length - 1, 0);

// Post times come from the X status id, which is a Snowflake: the top bits are a
// millisecond timestamp on the Twitter epoch. A pure function of a committed
// value, so it reads no clock, and no derived date is ever printed — the count
// is all that is published.
const X_EPOCH_MS = 1_288_834_974_657n;
const GPT_IMAGE_2_5_RELEASE_MS = Date.UTC(2026, 8, 8); // 2026-09-08, from three literals
const postMs = (statusId) => Number((BigInt(statusId) >> 22n) + X_EPOCH_MS);
const prelaunchRows = sourcedRows.filter((r) => postMs(r.statusId) < GPT_IMAGE_2_5_RELEASE_MS);

/** The nine names a locale value may use in a {placeholder}. */
const COUNTS = {
  prompts: num(rows.length),
  authors: num(authorSet.size),
  categories: num(categories.length),
  json: num(jsonRows.length),
  date: meta.corpusDate,
  prelaunch: num(prelaunchRows.length),
  sourced: num(sourcedRows.length),
  tokenrows: num(templateTokenRows.length),
};

// ---------------------------------------------------------------------------
// Invariants: corpus. Every one fails the build WITHOUT WRITING ANYTHING.
// ---------------------------------------------------------------------------

console.log('\ncorpus invariants');

derived('_meta.rowCount === rows.length', meta.rowCount === allRows.length, `${meta.rowCount} / ${allRows.length}`);
hard('_meta.corpusDate is YYYY-MM-DD', /^\d{4}-\d{2}-\d{2}$/.test(meta.corpusDate), meta.corpusDate);
hard('_meta.siteBase present and untagged', typeof meta.siteBase === 'string' && meta.siteBase.startsWith('https://') && !meta.siteBase.includes('utm_'), meta.siteBase);
hard('_meta.rightsNotice non-empty', typeof meta.rightsNotice === 'string' && meta.rightsNotice.trim().length > 0, `${meta.rightsNotice.length} chars`);
derived(
  '_meta.creditAudit covers every row',
  meta.creditAudit?.rowsAudited === allRows.length &&
    /^\d{4}-\d{2}-\d{2}$/.test(meta.creditAudit?.passedAt ?? '') &&
    meta.creditAudit.passedAt >= meta.corpusDate,
  `${meta.creditAudit?.rowsAudited} rows audited, passed ${meta.creditAudit?.passedAt}`,
);

// The canonical corpus hash, reimplemented from the prose in
// _meta.corpusSha256Algorithm and from nothing else: project each row onto the
// schema's required list, stringify with keys sorted by UTF-16 code unit, sort
// the row strings the same way, join with "\n", sha256 the UTF-8 bytes. Neither
// key order in the file nor row order in the array is load-bearing.
const HASH_KEYS = [...ROW_KEYS].sort(cmpU16);
function canonicalRow(r) {
  const projected = {};
  for (const k of HASH_KEYS) projected[k] = r[k];
  return JSON.stringify(projected);
}
const corpusHash = (list) => sha256(list.map(canonicalRow).sort(cmpU16).join('\n'));
const recomputedHash = corpusHash(allRows);
{
  derived(
    '_meta.corpusSha256 recomputes',
    recomputedHash === meta.corpusSha256,
    recomputedHash === meta.corpusSha256
      ? `${recomputedHash.slice(0, 16)}… over ${allRows.length} rows`
      : `${recomputedHash} != ${meta.corpusSha256} — data/prompts.json was hand-edited (use --restamp), or the schema's required list changed`,
  );
}

derived('_meta.categoryCount re-derives', meta.categoryCount === categories.length, `${meta.categoryCount}`);
derived('_meta.authorCount re-derives (lowercased)', meta.authorCount === new Set(allRows.map((r) => r.author.toLowerCase())).size, `${meta.authorCount}`);
derived('_meta.totalPromptChars re-derives', meta.totalPromptChars === allRows.reduce((n, r) => n + chars(r), 0), `${num(meta.totalPromptChars)} code points`);

// Upstreams, looked up BY ID and never by array index.
const upstreams = new Map(meta.upstreams.map((u) => [u.id, u]));
hard('_meta.upstreams unique by id', upstreams.size === meta.upstreams.length, `${upstreams.size} entries`);
for (const u of meta.upstreams) {
  const owned = allRows.filter((r) => r.upstream === u.id).length;
  hard(
    `upstream ${u.id}: repo, commit, permalink`,
    /^[\w.-]+\/[\w.-]+$/.test(u.repo) && /^[0-9a-f]{40}$/.test(u.commit) && u.commit !== 'unknown' && u.permalink === `https://github.com/${u.repo}/tree/${u.commit}`,
    `${u.repo} @ ${u.commit.slice(0, 12)} (${u.commitDate})`,
  );
  derived(
    `upstream ${u.id}: rows, files, fetchedAt`,
    u.rowCount === owned && u.bodiesMatchedAtCommit?.rows === owned && u.bodiesMatchedAtCommit?.unmatched === 0 && Array.isArray(u.files) && u.files.length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(u.fetchedAt),
    `${owned} rows, ${u.files?.length} source file(s), 0 unmatched, fetched ${u.fetchedAt}`,
  );
}

// Per row.
const seenSlug = new Set();
const seenSha = new Set();
const seenBody = new Set();
const rowKeySet = new Set(ALLOWED_KEYS);
const rowProblems = [];
for (const r of allRows) {
  const p = (msg) => rowProblems.push(`${r.slug ?? '<no slug>'}: ${msg}`);
  for (const k of ROW_KEYS) if (!(k in r)) p(`missing key ${k}`);
  for (const k of Object.keys(r)) if (!rowKeySet.has(k)) p(`unexpected key ${k}`);
  if (!ID_RE.test(r.slug)) p('slug does not match the id pattern');
  if (seenSlug.has(r.slug)) p('duplicate slug');
  seenSlug.add(r.slug);
  if (!String(r.title).trim()) p('empty title');
  if (!/^[A-Za-z0-9_]{1,15}$/.test(r.author)) p(`author is not an X handle: ${r.author}`);
  if (r.authorUrl !== `https://x.com/${r.author}`) p(`authorUrl does not match author: ${r.authorUrl}`);
  if (r.sourceUrl !== '' && !/^https:\/\/(x|twitter)\.com\/[A-Za-z0-9_]{1,15}\/status\/\d+$/.test(r.sourceUrl)) p(`sourceUrl malformed: ${r.sourceUrl}`);
  const parsedId = r.sourceUrl === '' ? null : r.sourceUrl.slice(r.sourceUrl.lastIndexOf('/') + 1);
  if (r.statusId !== parsedId) p(`statusId ${r.statusId} is not the id in sourceUrl`);
  if (typeof r.isJson !== 'boolean') p('isJson is not a boolean');
  // `direct` means the author sent it to us, so there is no upstream collection
  // entry to match -- its provenance is the `consent` record on the row itself.
  if (r.upstream !== 'direct' && !upstreams.has(r.upstream)) p(`unknown upstream ${r.upstream}`);
  if (r.upstream === 'direct' && !r.consent?.issue) p('direct row without a consent record');
  if (!String(r.upstreamStatedTerms ?? '').trim()) p('empty upstreamStatedTerms');
  if (!catIndex.has(r.category)) p(`unknown category ${r.category}`);
  if (!String(r.prompt).length) p('empty prompt');
  const sha = sha256(r.prompt);
  if (sha !== r.promptSha256) p(`promptSha256 mismatch (${sha})`);
  if (seenSha.has(r.promptSha256)) p('duplicate promptSha256');
  seenSha.add(r.promptSha256);
  if (seenBody.has(r.prompt)) p('duplicate prompt body');
  seenBody.add(r.prompt);
  if (r.url !== `${meta.siteBase}#${r.slug}`) p(`url is not siteBase#slug: ${r.url}`);
  if (r.url.includes('utm_')) p('url carries UTM; the canonical row URL stays clean');
}
hard('every row passes the shape rules', rowProblems.length === 0, rowProblems.length ? rowProblems.slice(0, 5).join(' | ') : `${allRows.length} rows × ${ROW_KEYS.length} keys`);

hard('every category has at least one row', categories.every((c) => rowsByCategory.get(c).length > 0), categories.map((c) => `${c}=${rowsByCategory.get(c).length}`).join(' '));
hard('every category has a file stem, and vice versa', categories.every((c) => USE_CASE[c]) && Object.keys(USE_CASE).every((c) => catIndex.has(c)), `${Object.keys(USE_CASE).length} stems`);
hard('no tombstoned status id survives into a render', rows.every((r) => !r.statusId || !tombstones.has(String(r.statusId))), `${tombstones.size} tombstone(s), ${droppedByTombstone} row(s) dropped`);

// A tombstone is honoured when the RECORD IS GONE FROM data/prompts.json, its
// prompt text included. The filter above is a safety net, not the removal: it
// keeps the body out of every rendered file, but data/prompts.json is published
// too — llms.txt links its raw URL and quotes its record count, its byte size
// and its corpus hash — so a tombstoned row still sitting in it is a takedown
// that did not happen, described by an llms.txt that now states a count the
// file does not have. Both of these were once asked of `rows`, which this very
// filter defines, so neither could ever fail; they are asked of the file.
// `--restamp` is the repair, and it is the whole removal: it rewrites
// data/prompts.json from the filtered set.
const stillTombstoned = allRows.filter((r) => r.statusId && tombstones.has(String(r.statusId)));
if (MODE === 'restamp') {
  check(
    'every tombstone is honoured in data/prompts.json',
    true,
    stillTombstoned.length ? `${stillTombstoned.length} tombstoned row(s) will be deleted by --restamp` : `${tombstones.size} tombstone(s), nothing left to delete`,
  );
} else {
  hard(
    'every tombstone is honoured in data/prompts.json',
    stillTombstoned.length === 0,
    stillTombstoned.length
      ? `${stillTombstoned.length} tombstoned row(s) still carry their prompt text in data/prompts.json (${stillTombstoned.map((r) => r.slug).sort(cmpU16).join(', ')}); run --restamp to delete them`
      : `${tombstones.size} tombstone(s), 0 tombstoned row(s) left in the file`,
  );
}
derived('row order is category order then slug',  allRows.map((r) => r.slug).join('\u0000') === inRenderOrder(allRows).map((r) => r.slug).join('\u0000'), 'category render order, then slug ascending');
hard('data/prompts.json under budget', fileBytes('data/prompts.json') < BUDGET.promptsJson, `${num(fileBytes('data/prompts.json'))} B < ${num(BUDGET.promptsJson)} B (${num(BUDGET.promptsJson - fileBytes('data/prompts.json'))} B spare)`);

// ---------------------------------------------------------------------------
// --restamp, computed here and WRITTEN LATER.
//
// The derived fields are recomputed in memory and `meta` is updated in place
// BEFORE anything renders, so llms.txt embeds the new corpusSha256 and the new
// byte size rather than the ones it is about to replace. The file itself is
// written in the same phase as every other output, so a later invariant failure
// still writes nothing at all.
// ---------------------------------------------------------------------------

let restampedJson = null;
if (MODE === 'restamp') {
  meta.rowCount = rows.length;
  meta.categoryCount = categories.length;
  meta.authorCount = authorSet.size;
  meta.totalPromptChars = totalPromptChars;
  meta.corpusSha256 = corpusHash(rows);
  meta.creditAudit = { ...meta.creditAudit, rowsAudited: rows.length };
  meta.upstreams = meta.upstreams.map((u) => {
    const owned = rows.filter((r) => r.upstream === u.id).length;
    return { ...u, bodiesMatchedAtCommit: { ...u.bodiesMatchedAtCommit, rows: owned }, rowCount: owned };
  });
  restampedJson =
    JSON.stringify(
      {
        _meta: meta,
        prompts: sortedRows.map((r) => {
          const o = {};
          for (const k of ALLOWED_KEYS) if (k in r) o[k] = r[k];
          return o;
        }),
      },
      null,
      2,
    ) + '\n';
  console.log(
    `\nrestamp\n  data/prompts.json            ${num(bytes(restampedJson))} B, ${rows.length} rows, ` +
      `${meta.authorCount} authors, ${num(meta.totalPromptChars)} chars, ${meta.corpusSha256.slice(0, 16)}…`,
  );
  if (bytes(restampedJson) >= BUDGET.promptsJson) {
    console.error(`  data/prompts.json would be ${num(bytes(restampedJson))} B, over the ${num(BUDGET.promptsJson)} B guard; nothing written`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Invariants: locales
// ---------------------------------------------------------------------------

console.log('\nlocale invariants');

function flatten(obj, prefix = '', out = []) {
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
    else out.push([key, v]);
  }
  return out;
}
const flatLocales = Object.fromEntries(LOCALES.map((l) => [l, new Map(flatten(localeData[l]))]));
const enKeys = [...flatLocales.en.keys()];
const contentKeys = enKeys.filter((k) => !k.startsWith('$meta.'));

for (const l of LOCALES) {
  const keys = [...flatLocales[l].keys()];
  const same = keys.length === enKeys.length && keys.every((k, i) => k === enKeys[i]);
  // Name the keys. "115 keys, same order" told a maintainer that one of 116 had
  // gone without saying which, and said "same order" while failing.
  const missing = enKeys.filter((k) => !flatLocales[l].has(k));
  const extra = keys.filter((k) => !flatLocales.en.has(k));
  hard(
    `locales/${l}.json key set matches en`,
    same,
    same
      ? `${keys.length} keys, same order`
      : missing.length || extra.length
        ? `${missing.length} missing (${missing.slice(0, 3).join(', ')}), ${extra.length} extra (${extra.slice(0, 3).join(', ')})`
        : `${keys.length} keys, same set, DIFFERENT ORDER`,
  );
}
console.log(`  --   key set                                          ${enKeys.length} keys (${enKeys.length - contentKeys.length} $meta + ${contentKeys.length} content)`);

const phSet = (s) => [...String(s).matchAll(/\{([^{}]*)\}/g)].map((m) => m[1]).sort(cmpU16).join(',');
const localeProblems = [];
for (const l of LOCALES) {
  for (const k of contentKeys) {
    const v = flatLocales[l].get(k);
    if (typeof v !== 'string' || !v.trim()) localeProblems.push(`${l}.${k}: empty`);
    if (/\*\*|`|\|/.test(String(v))) localeProblems.push(`${l}.${k}: contains markdown`);
    if (phSet(v) !== phSet(flatLocales.en.get(k))) localeProblems.push(`${l}.${k}: placeholder set differs from en`);
    for (const [, name] of String(v).matchAll(/\{([^{}]*)\}/g)) {
      if (!(name in COUNTS) && name !== 'count') localeProblems.push(`${l}.${k}: unimplemented placeholder {${name}}`);
    }
  }
  if (flatLocales[l].get('$meta.dir') !== (l === 'ar' ? 'rtl' : 'ltr')) localeProblems.push(`${l}: wrong $meta.dir`);
  if (!String(flatLocales[l].get('$meta.name') ?? '').trim()) localeProblems.push(`${l}: empty $meta.name`);
  if (flatLocales[l].get('$meta.locale') !== l) localeProblems.push(`${l}: $meta.locale mismatch`);
  if (!/^[0-9a-f]{64}$/.test(String(flatLocales[l].get('$meta.sourceSha')))) localeProblems.push(`${l}: no sourceSha`);
}
hard('locale values: non-empty, no markdown, same placeholders', localeProblems.length === 0, localeProblems.length ? localeProblems.slice(0, 5).join(' | ') : `${LOCALES.length * contentKeys.length} values across ${LOCALES.length} locales`);

const arOffenders = contentKeys.filter((k) => needsRlm(String(flatLocales.ar.get(k))));
hard('ar values: Latin/digit-initial ones carry U+200F', arOffenders.length === 0, arOffenders.length ? arOffenders.join(', ') : `${contentKeys.filter((k) => String(flatLocales.ar.get(k)).startsWith(RLM)).length} of ${contentKeys.length} carry the mark`);
hard('all six locales share one sourceCommit', new Set(LOCALES.map((l) => flatLocales[l].get('$meta.sourceCommit'))).size === 1 && /^[0-9a-f]{40}$/.test(String(flatLocales.en.get('$meta.sourceCommit'))), String(flatLocales.en.get('$meta.sourceCommit')).slice(0, 12));

/** Locale accessor that throws rather than rendering "undefined" into a file. */
function L(locale, key, vars) {
  const map = flatLocales[locale];
  if (!map.has(key)) throw new BuildError(`locales/${locale}.json is missing ${key}`);
  const raw = String(map.get(key));
  return vars === undefined ? raw : fmt(raw, vars, `locales/${locale}.json → ${key}`);
}

// The guide and FAQ item ids, in locale-file order. These are ALREADY the
// filtered sets — three shipped FAQ answers were dropped by the export, two as
// rights claims and one for a median measured more than 2x wrong — so no
// renderer carries an exclusion list of its own.
const idsUnder = (prefix, suffix) =>
  contentKeys.filter((k) => k.startsWith(prefix) && k.endsWith(suffix)).map((k) => k.slice(prefix.length, k.length - suffix.length));
const GUIDE_IDS = idsUnder('guide.items.', '.title');
const FAQ_IDS = idsUnder('faq.items.', '.q');

// ---------------------------------------------------------------------------
// Escaping self-test, over the whole corpus, on every build
// ---------------------------------------------------------------------------

console.log('\nescaping self-test');

function selfTestEscaping() {
  const problems = [];
  const probe = (label, s) => {
    const c = cell(s);
    if (/[\n\r]/.test(c)) problems.push(`${label}: a newline survived into a table cell`);
    if (/(^|[^\\])[|<>`[\]*_~&]/.test(c)) problems.push(`${label}: unescaped markdown or HTML character`);
    // A GFM row splits on unescaped pipes: this cell must add exactly none.
    if (`| ${c} | x |`.split(/(?<!\\)\|/).length - 1 !== 3) problems.push(`${label}: cell adds a column to its table row`);
  };
  for (const r of rows) {
    probe(`body ${r.slug}`, r.prompt);
    probe(`title ${r.slug}`, r.title);
    if (r.prompt.includes(fenceFor(r.prompt))) problems.push(`body ${r.slug}: the fence occurs inside the body`);
  }
  return problems;
}
const escProblems = selfTestEscaping();
const hazardPipes = rows.reduce((n, r) => n + (r.prompt.match(/\|/g) || []).length, 0);
const hazardLt = rows.reduce((n, r) => n + (r.prompt.match(/</g) || []).length, 0);
const hazardNl = rows.filter((r) => r.prompt.includes('\n')).length;
hard(
  'cell() neutralises every body and every title',
  escProblems.length === 0,
  escProblems.length
    ? escProblems.slice(0, 3).join(' | ')
    : `${rows.length * 2} strings; corpus holds ${hazardPipes} pipe(s), ${hazardLt} '<', ${hazardNl} multiline bodies, ${templateTokenCount} {argument} tokens`,
);

// ---------------------------------------------------------------------------
// Templates: content fragments, llms.txt.tmpl, the About string.
//
// A fragment declares its own section id in its header comment, so adding one
// needs no edit here. build.mjs strips exactly the leading comment block — from
// the opening `<!--` through the first `-->` and the newline after it — and
// passes everything else through VERBATIM, including the `<!-- item: … -->`
// markers, which must survive into README.md.
// ---------------------------------------------------------------------------

console.log('\ntemplates');

function loadFragments() {
  const replace = new Map(); // section        -> { file, body }
  const append = new Map(); // `section:locale` -> { file, body }
  const dir = join(ROOT, 'content');
  if (!existsSync(dir)) {
    console.log('  content/                     absent — every README renders from its locale file alone');
    return { replace, append };
  }
  const bad = [];
  const skipped = [];
  const files = [];
  (function walk(abs, prefix) {
    for (const e of readdirSync(abs, { withFileTypes: true }).sort(byKey((x) => x.name))) {
      const rel = prefix ? `${prefix}/${e.name}` : e.name;
      if (e.isDirectory()) walk(join(abs, e.name), rel);
      else files.push(rel);
    }
  })(dir, '');

  for (const rel of files) {
    if (rel.endsWith('.txt')) continue; // documentation (PLACEHOLDERS.txt), never published
    const raw = readText(`content/${rel}`);
    // Strip a leading header comment, but only when it is a header -- a
    // fragment's body may legitimately open with an HTML comment of its own.
    const end_ = raw.indexOf('-->');
    const head = end_ === -1 ? '' : raw.slice(0, end_);
    const isHeader = raw.trimStart().startsWith('<!--') && /^\s*(section|fragment):/m.test(head);
    const body = (isHeader ? raw.slice(end_ + 3).replace(/^\r?\n/, '') : raw).trim();

    const slash = rel.lastIndexOf('/');
    const dirPart = slash === -1 ? '' : rel.slice(0, slash);
    const name = slash === -1 ? rel : rel.slice(slash + 1);

    if (dirPart === '' && FRAGMENT_FLAT_RE.test(name)) {
      const section = /^\s*section:\s*([a-z0-9-]+)/m.exec(head)?.[1];
      if (section === 'rights') {
        skipped.push(rel);
        continue;
      }
      if (!section || !SECTION_IDS.includes(section)) {
        bad.push(`${rel} (header declares no known "section:" — got ${JSON.stringify(section ?? null)})`);
        continue;
      }
      if (replace.has(section)) {
        bad.push(`${rel} (section ${section} already claimed by ${replace.get(section).file})`);
        continue;
      }
      replace.set(section, { file: `content/${rel}`, body });
      continue;
    }

    if (dirPart === 'readme') {
      const m = FRAGMENT_SECTION_RE.exec(name);
      const section = m?.[1];
      const locale = m?.[2] ?? 'en';
      if (!m || !SECTION_IDS.includes(section) || !LOCALES.includes(locale)) {
        bad.push(`${rel} (not <section>[.<locale>].md for a known section)`);
        continue;
      }
      const key = `${section}:${locale}`;
      if (append.has(key)) {
        bad.push(`${rel} (${key} already claimed by ${append.get(key).file})`);
        continue;
      }
      append.set(key, { file: `content/${rel}`, body });
      continue;
    }

    bad.push(rel);
  }

  if (bad.length) {
    console.error(
      `\ncontent/ holds ${bad.length} path(s) this build cannot place: ${bad.join(', ')}\n` +
        `  accepted: content/readme/<section>[.<locale>].md, appended after that section; or\n` +
        `            content/NN-<name>.md whose leading <!-- … --> header declares "section: <id>",\n` +
        `            which replaces that section in README.md.\n` +
        `  sections: ${SECTION_IDS.join('|')}   locales: ${LOCALES.join('|')}   a .txt is documentation.`,
    );
    process.exit(1);
  }
  console.log(
    `  content/                     ${replace.size} replacing, ${append.size} appending` +
      (skipped.length ? `, ${skipped.length} skipped (licence pass deferred)` : '') +
      `${append.size ? ` [${[...append.keys()].sort(cmpU16).join(' ')}]` : ''}`,
  );
  return { replace, append };
}
const { replace: fragReplace, append: fragAppend } = loadFragments();

function loadTemplate(relPath, fallback, onlyWhenTemplated = false) {
  if (existsSync(join(ROOT, relPath))) {
    const raw = readText(relPath);
    if (!onlyWhenTemplated || raw.includes('{{')) {
      console.log(`  ${relPath.padEnd(28)} from file (${num(bytes(raw))} B)`);
      return raw;
    }
    console.log(`  ${relPath.padEnd(28)} already rendered — the template is the constant in build.mjs`);
    return fallback;
  }
  console.log(`  ${relPath.padEnd(28)} absent — built-in default`);
  return fallback;
}
const llmsTmpl = loadTemplate('llms.txt.tmpl', null);
if (llmsTmpl === null) {
  console.error('llms.txt.tmpl is missing and there is no built-in default for it');
  process.exit(1);
}
// metadata/about.txt is both the hand-written template and the generated file:
// while it still holds `{{` that copy is the template, and after the first build
// the constant takes over so the counts inside it keep regenerating.
const aboutTmpl = loadTemplate('metadata/about.txt', ABOUT_TMPL_DEFAULT, true);

// ---------------------------------------------------------------------------
// Renderers
// ---------------------------------------------------------------------------

const destination = makeDestination(meta.siteBase);
const SITE_LLMS_TXT = `${destination.origin}/llms.txt`; // citation-shaped, deliberately untagged
const UNTAGGED_ALLOWED = new Set([meta.siteBase, SITE_LLMS_TXT]);

const promptFilePath = (c) => `prompts/gpt-image-2-5-${USE_CASE[c]}-prompts.md`;
const readmePath = (l) => (l === 'en' ? 'README.md' : `README.${l}.md`);
const promptAnchor = (slug) => `${PROMPT_ANCHOR_PREFIX}${slug}`;
const categoryAnchor = (c) => `${CATEGORY_ANCHOR_PREFIX}${c}`;

/** The fence language for a verbatim body. Deterministic, from the data. */
function fenceLang(r) {
  if (!r.isJson) return 'text';
  try {
    JSON.parse(r.prompt);
    return 'json';
  } catch {
    return 'text';
  }
}

// --- prompts/gpt-image-2-5-<use-case>-prompts.md ---------------------------
// English only. The bodies are verbatim third-party text; translating one makes
// a derivative work we cannot authorise, and 25 of them are JSON with English
// keys. This is the only place a whole prompt body is published by us.

function renderPromptFile(category) {
  const d = new Doc(promptFilePath(category), 'en');
  const list = rowsByCategory.get(category);
  const t = (k, v) => L('en', k, v);

  d.block(GENERATED_BANNER('data/prompts.json and locales/en.json'));
  d.block(`# ${esc(t(`categories.${category}.heading`))}`);
  d.block(esc(t(`categories.${category}.blurb`)));
  const [image, alt] = EXAMPLE_IMAGE[category];
  d.block(`<p align="center"><img src="../images/examples/${image}" alt="${alt}" width="720"></p>`);
  d.block(`**[${esc(t('browse.open_file', { count: num(list.length) }))}](${destination({ locale: 'en', medium: 'category', content: category, hash: category })})**`);
  d.block([
    d.rel('../README.md', esc(t('chrome.title'))),
    d.rel('../README.md#browse', esc(t('browse.heading'))),
    d.rel('../README.md#guide', esc(t('guide.heading'))),
  ].join(' · '));
  d.block(`${esc(t('chrome.disclaimer_trademark'))} ${esc(t('chrome.disclaimer_availability'))}`);
  d.block('---');

  for (const r of list) {
    d.anchor(promptAnchor(r.slug));
    d.block(`## ${esc(r.title)}`);
    const credit = [`[@${esc(r.author)}](${r.authorUrl})`];
    if (r.sourceUrl) credit.push(`[x.com](${r.sourceUrl})`);
    // A `direct` row came straight from its author, so there is no collection to
    // link; its consent record stands in that slot instead.
    credit.push(
      r.upstream === 'direct'
        ? `[used with permission](${r.consent.issue})`
        : `[\`${r.upstream}\`](${upstreams.get(r.upstream).permalink})`,
    );
    d.block(credit.join(' · '));
    d.block(codeBlock(r.prompt, fenceLang(r)));
    d.block(`[${esc(t('cta.primary'))}](${destination({ locale: 'en', medium: 'prompt', content: r.slug, hash: r.slug })})`);
  }

  d.block('---');
  d.block(d.rel('../README.md#index', esc(t('index.heading'))));
  return d;
}

// --- README.md and the five translations -----------------------------------

function renderSwitcher(d, locale) {
  // Pinned dir="ltr", English first, current locale bold and NOT a self-link, so
  // the block renders byte-identically in all six files. Plain text, zero badge
  // images: an LLM and a crawler read it without going through an alt attribute,
  // it cannot be rate-limited, and it renders in every markdown viewer.
  const parts = LOCALES.map((l) => {
    const name = String(flatLocales[l].get('$meta.name'));
    if (l === locale) return `  <strong>${name}</strong>`;
    d.links.push({ from: d.path, target: readmePath(l) });
    return `  <a href="${readmePath(l)}">${name}</a>`;
  });
  return `<p align="center" dir="ltr">\n${parts.join(' ·\n')}\n</p>`;
}

function renderCategoryList(d, locale) {
  const t = (k, v) => L(locale, k, v);
  return d.list(
    categories.map((c) => {
      const n = rowsByCategory.get(c).length;
      const label = `**[${esc(t(`categories.${c}.label`))}](${destination({ locale, medium: 'category', content: c, hash: c })})**`;
      const open = d.rel(promptFilePath(c), esc(t('browse.open_file', { count: num(n) })));
      return `${label} — ${esc(t(`categories.${c}.blurb`))} ${open}`;
    }),
  );
}

/** The full index, English only: nine tables, each behind its own anchor. */
function renderIndex(d, locale, dropCols) {
  const t = (k) => L(locale, k);
  // The over-budget message quotes a cost per index row. Measure it here, off
  // the rows actually emitted at the rung actually in force, rather than
  // carrying a hand-typed constant: the 394.7 B/row this replaced no longer
  // matched what the index rendered at, and it is the one number a maintainer
  // reading the failure would act on. A repository whose whole claim is that it
  // types no count by hand cannot type this one either. It also has to be
  // per-rung: dropping two columns changes the cost, so a fixed constant is
  // wrong in at least one of the two states the message can be printed in.
  let indexBytes = 0;
  let indexRows = 0;
  const cols = [
    ['prompt', t('index.col_prompt')],
    ['author', t('index.col_author')],
    ['source', t('index.col_source')],
    ['run', t('index.col_run')],
  ].filter(([id]) => !dropCols.includes(id));
  for (const c of categories) {
    const list = rowsByCategory.get(c);
    if (!list.length) continue;
    d.anchor(categoryAnchor(c));
    d.block(`### ${esc(t(`categories.${c}.heading`))}`);
    const body = list.map((r) => {
      const byId = {
        prompt: d.rel(`${promptFilePath(c)}#${promptAnchor(r.slug)}`, cell(r.title)),
        author: `[@${cell(r.author)}](${r.authorUrl})`,
        source: r.sourceUrl ? `[x.com](${r.sourceUrl})` : '—',
        run: `[youart.ai](${destination({ locale, medium: 'index', content: r.slug, hash: r.slug })})`,
      };
      return `| ${cols.map(([id]) => byId[id]).join(' | ')} |`;
    });
    d.block([`| ${cols.map(([, label]) => esc(label)).join(' | ')} |`, `|${cols.map(() => '---').join('|')}|`, ...body].join('\n'));
    indexBytes += bytes(body.join('\n') + '\n');
    indexRows += body.length;
  }
  d.indexRowBytes = indexRows ? indexBytes / indexRows : 0;
}

/**
 * The machine-surface block. A TABLE in the five LTR files; a LIST in ar, where
 * GitHub stamps dir="auto" on nothing inside <table> (0 of 235 measured) and
 * serves the page <html lang="en">, so a table would keep LTR column order. The
 * same three column labels become inline labels there, so no locale key is dead.
 */
function renderMachineSurfaces(d, locale, sizes) {
  const t = (k) => L(locale, k);
  const surfaces = [
    [t('index.heading'), 'data/prompts.json'],
    [t('machines.heading'), 'llms.txt'],
    ...categories.map((c) => [t(`categories.${c}.label`), promptFilePath(c)]),
  ];
  if (locale === 'ar') {
    return d.list(
      surfaces.map(
        ([what, path]) =>
          `${esc(t('machines.col_contents'))}: ${esc(what)} · ${esc(t('machines.col_file'))}: [\`${path}\`](${RAW_BASE}/${path}) · ${esc(t('machines.col_bytes'))}: ${num(sizes[path])}`,
      ),
    );
  }
  return [
    `| ${esc(t('machines.col_contents'))} | ${esc(t('machines.col_file'))} | ${esc(t('machines.col_bytes'))} |`,
    '|---|---|--:|',
    ...surfaces.map(([what, path]) => `| ${cell(what)} | [\`${path}\`](${RAW_BASE}/${path}) | ${num(sizes[path])} |`),
  ].join('\n');
}

function renderReadme(locale, sizes, dropCols = []) {
  const d = new Doc(readmePath(locale), locale);
  const t = (k, v) => L(locale, k, v);
  const isEn = locale === 'en';
  const sect = (id, headingKey) => {
    d.anchor(id);
    d.block(`## ${esc(t(headingKey))}`);
  };
  /** A content/NN-*.md fragment replacing this section's body. English only. */
  const frag = (id, vars) => {
    if (!isEn) return null;
    const f = fragReplace.get(id);
    return f ? fillTemplate(f.body, vars ?? TEMPLATE_VARS, f.file) : null;
  };
  /** A content/readme/<section>[.<locale>].md fragment appended to this section. */
  const extra = (id, vars) => {
    const f = fragAppend.get(`${id}:${locale}`);
    if (f) d.block(fillTemplate(f.body, vars ?? TEMPLATE_VARS, f.file));
  };

  d.block(GENERATED_BANNER(`data/prompts.json and locales/${locale}.json`));
  d.block(renderSwitcher(d, locale));
  d.block(`# ${esc(t('chrome.title'))}`);
  d.block(
    `<p align="center"><img src="images/examples/travel.webp" alt="Awesome GPT Image 2.5 prompts — cinematic image example generated on YouArt" width="960"></p>`,
  );
  // Badges. Only claims we can back: the two licences we actually grant, a
  // contribution invitation the issue templates honour, a CI badge for a
  // workflow that exists, and a count the build computed. Deliberately NOT the
  // awesome.re badge -- this list is not in sindresorhus/awesome, and both
  // rivals wear it anyway.
  d.block(
    [
      `[![License](https://img.shields.io/badge/license-see%20LICENSE-blue.svg)](LICENSE)`,
      `[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)`,
      `[![verify](https://github.com/${REPO_OWNER}/${REPO_NAME}/actions/workflows/verify.yml/badge.svg)](https://github.com/${REPO_OWNER}/${REPO_NAME}/actions/workflows/verify.yml)`,
      `![Prompts](https://img.shields.io/badge/prompts-${rows.length}-111111.svg)`,
    ].join('\n'),
  );
  d.block(rlmGuard(locale, esc(t('chrome.tagline', COUNTS))));
  d.block(rlmGuard(locale, esc(t('chrome.stats', COUNTS))));
  d.block(`**[${esc(t('cta.primary'))}](${destination({ locale, medium: 'hero', content: 'hero' })})**`);
  // Never render one disclaimer without the other: they are one paragraph.
  d.block(rlmGuard(locale, `${esc(t('chrome.disclaimer_trademark'))} ${esc(t('chrome.disclaimer_availability'))}`));

  sect('what', 'what.heading');
  d.block(frag('what') ?? `${esc(t('what.body'))}\n\n${esc(t('what.origin', COUNTS))}`);
  extra('what');

  sect('how', 'how.heading');
  d.block(
    frag('how') ??
      `${['how.step_1', 'how.step_2', 'how.step_3'].map((k, i) => `${i + 1}. ${rlmGuard(locale, esc(t(k)))}`).join('\n')}\n\n` +
        rlmGuard(locale, esc(t('how.template_token_note', COUNTS))),
  );
  extra('how');

  sect('browse', 'browse.heading');
  d.block(esc(t('browse.prompt_language_note')));
  d.block(renderCategoryList(d, locale));
  extra('browse');

  sect('guide', 'guide.heading');
  const guideFrag = frag('guide');
  if (guideFrag) {
    d.block(guideFrag); // a replacing fragment may carry the rights placeholder itself
  } else {
    d.block(esc(t('guide.intro')));
    for (const id of GUIDE_IDS) {
      d.block(`### ${esc(t(`guide.items.${id}.title`))}`);
      d.block(esc(t(`guide.items.${id}.body`)));
    }
  }
  extra('guide');
  // The rights section goes here and is deliberately empty in this draft. Emit
  // the marker unless a fragment already carried it, so it appears exactly once.
  // The rights section. Short on purpose: it says what we made, what we did not,
  // and who to ask -- the long form lives in LICENSE, ATTRIBUTION.md and
  // TAKEDOWN.md, which this links rather than restates.
  sect('rights', 'rights.heading');
  d.block(rlmGuard(locale, esc(t('rights.ours'))));
  d.block(rlmGuard(locale, esc(t('rights.theirs'))));
  d.block(rlmGuard(locale, esc(t('rights.removal'))));
  d.block(
    `${d.rel('LICENSE', '`LICENSE`')} \u00b7 ${d.rel('ATTRIBUTION.md', '`ATTRIBUTION.md`')} \u00b7 ${d.rel('TAKEDOWN.md', '`TAKEDOWN.md`')}`,
  );
  extra('rights');

  sect('json', 'json.heading');
  d.block(esc(t('json.intro')));
  d.block(esc(t('json.when')));
  extra('json');

  if (isEn) {
    sect('index', 'index.heading');
    d.block(esc(t('index.intro', COUNTS)));
    renderIndex(d, locale, dropCols);
    extra('index');
  }

  sect('faq', 'faq.heading');
  const faqFrag = frag('faq');
  if (faqFrag) d.block(faqFrag);
  else {
    for (const id of FAQ_IDS) {
      d.block(`### ${esc(t(`faq.items.${id}.q`))}`);
      d.block(esc(t(`faq.items.${id}.a`)));
    }
  }
  extra('faq');

  sect('machines', 'machines.heading');
  const machinesFrag = frag('machines', { ...TEMPLATE_VARS, MACHINE_SURFACE_TABLE: renderMachineSurfaces(d, locale, sizes) });
  if (machinesFrag) d.block(machinesFrag);
  else {
    d.block(esc(t('machines.body')));
    d.block(renderMachineSurfaces(d, locale, sizes));
    d.block(`${esc(t('machines.index_note'))} ${d.rel('llms.txt', '`llms.txt`')}`);
    d.block(rlmGuard(locale, esc(t('machines.quote_note'))));
  }
  extra('machines');

  // English closes with the about fragment, which carries its own footer CTA.
  // The translations get the locale-driven CTA section first.
  if (!isEn) {
    sect('cta', 'cta.heading');
    d.block(esc(t('cta.body')));
    d.block(
      `**[${esc(t('cta.primary'))}](${destination({ locale, medium: 'footer', content: 'footer' })})** · ` +
        `[${esc(t('cta.browse_all', COUNTS))}](${destination({ locale, medium: 'footer', content: 'footer' })})`,
    );
    extra('cta');
  }

  sect('about', 'about.heading');
  const aboutFrag = frag('about');
  if (aboutFrag) d.block(aboutFrag);
  else {
    d.block(rlmGuard(locale, esc(t('about.maintainer'))));
    d.block(rlmGuard(locale, esc(t('about.body', COUNTS))));
    d.block(`[youart.ai](${destination({ locale, medium: 'footer', content: 'brand', root: true })})`);
  }
  extra('about');

  return d;
}

// --- llms.txt ---------------------------------------------------------------

function renderLlms(sizes) {
  const d = new Doc('llms.txt', 'en');
  const t = (k) => L('en', k);
  const promptFileLines = categories
    .map((c) => {
      const p = promptFilePath(c);
      return `- [${p}](${RAW_BASE}/${p}): ${t(`categories.${c}.label`)}, ${rowsByCategory.get(c).length} prompts, full text, ${num(sizes[p])} bytes. ${t(`categories.${c}.blurb`)}`;
    })
    .join('\n');
  const categoryLines = categories
    .map((c) => {
      const url = destination({ locale: 'en', source: 'llmstxt', medium: 'category', content: c, hash: c });
      return `- [${t(`categories.${c}.label`)}](${url}): ${rowsByCategory.get(c).length} prompts. ${t(`categories.${c}.blurb`)}`;
    })
    .join('\n');

  d.block(
    fillTemplate(
      llmsTmpl,
      {
        ...TEMPLATE_VARS,
        PROMPT_FILE_LINES: promptFileLines,
        CATEGORY_LINES: categoryLines,
        PROMPTS_JSON_BYTES: num(sizes['data/prompts.json']),
        LIBRARY_URL_TAGGED: destination({ locale: 'en', source: 'llmstxt', medium: 'hero', content: 'library' }),
      },
      'llms.txt.tmpl',
    ).trim(),
  );
  return d;
}

// ---------------------------------------------------------------------------
// The declared template-placeholder registry — every {{NAME}} a template may
// use, per content/PLACEHOLDERS.txt. An unknown or unimplemented name fails the
// build with this list printed. Anything measured is measured here, once.
// ---------------------------------------------------------------------------

// Two name families are in use across the hand-written prose, and both are
// declared here rather than renaming somebody's file: PROMPT_COUNT / ROW_COUNT
// are the same number, as are <X>_CHARS and <X>_PROMPT_CHARS.
const TEMPLATE_VARS = {
  // counts
  PROMPT_COUNT: num(rows.length),
  ROW_COUNT: num(rows.length),
  AUTHOR_COUNT: num(authorSet.size),
  CATEGORY_COUNT: num(categories.length),
  PROSE_COUNT: num(proseRows.length),
  JSON_COUNT: num(jsonRows.length),
  SOURCED_COUNT: num(sourcedRows.length),
  PRELAUNCH_COUNT: num(prelaunchRows.length),
  UPSTREAM_COUNT: num(meta.upstreams.length),
  // the shape of the corpus
  MEDIAN_CHARS: num(median(rows.map(chars))),
  MEDIAN_PROMPT_CHARS: num(median(rows.map(chars))),
  SHORTEST_CHARS: num(Math.min(...rows.map(chars))),
  SHORTEST_PROMPT_CHARS: num(Math.min(...rows.map(chars))),
  LONGEST_CHARS: num(Math.max(...rows.map(chars))),
  LONGEST_PROMPT_CHARS: num(Math.max(...rows.map(chars))),
  TOTAL_CHARS: num(totalPromptChars),
  TOTAL_PROMPT_CHARS: num(totalPromptChars),
  JSON_MEDIAN_CHARS: num(median(jsonRows.map(chars))),
  PROSE_MEDIAN_CHARS: num(median(proseRows.map(chars))),
  LONGEST_QUARTILE_COUNT: num(longestQuarter.length),
  LONGEST_QUARTILE_MIN_CHARS: num(Math.min(...longestQuarter.map(chars))),
  LONGEST_QUARTILE_JSON_COUNT: num(longestQuarter.filter((r) => r.isJson).length),
  LONGEST_QUARTILE_LINE_MEDIAN: num(median(longestQuarter.map(lines))),
  SHORTEST_QUARTILE_LINE_MEDIAN: num(median(shortestQuarter.map(lines))),
  MULTILINE_COUNT: num(rows.filter((r) => r.prompt.includes('\n')).length),
  // what the length is spent on
  QUOTED_TEXT_COUNT: num(proseRows.filter((r) => RE_QUOTED.test(r.prompt)).length),
  CAMERA_COUNT: num(cameraRows.length),
  CAMERA_TOP_CATEGORY_LABEL: L('en', `categories.${cameraTop.category}.label`),
  CAMERA_TOP_CATEGORY_COUNT: num(cameraTop.hit),
  CAMERA_TOP_CATEGORY_TOTAL: num(cameraTop.total),
  EXCLUSION_COUNT: num(rows.filter((r) => RE_EXCLUSION.test(r.prompt)).length),
  FORMAT_COUNT: num(rows.filter((r) => RE_FORMAT.test(r.prompt)).length),
  HEX_COLOUR_ROWS: num(rows.filter((r) => RE_HEX.test(r.prompt)).length),
  TEMPLATE_TOKEN_ROWS: num(templateTokenRows.length),
  TEMPLATE_TOKEN_COUNT: num(templateTokenCount),
  BRACKET_TOKEN_ROWS: num(rows.filter((r) => RE_BRACKET_TOKEN.test(r.prompt)).length),
  // provenance and addresses
  CORPUS_DATE: meta.corpusDate,
  CORPUS_SHA256: meta.corpusSha256,
  SCHEMA_VERSION: String(meta.schemaVersion),
  SITE_BASE: meta.siteBase, // canonical and UNTAGGED: it is copied into other people's files
  URL_LLMS_TXT: `<${SITE_LLMS_TXT}>`, // ditto, autolinked so it is clickable inside prose
  REPO_URL,
  RAW_BASE,
  REPO_OWNER,
  REPO_NAME,
  URL_BRAND: destination({ locale: 'en', medium: 'footer', content: 'brand', root: true }),
  URL_FOOTER: destination({ locale: 'en', medium: 'footer', content: 'footer' }),
  URL_HOMEPAGE: destination({ locale: 'en', medium: 'about', content: 'homepage' }), // metadata/homepage.txt
  URL_EXAMPLES: destination({ locale: 'en', medium: 'examples', content: 'gallery' }),
  // supplied per call site; declared null here so the failure message lists them
  MACHINE_SURFACE_TABLE: null,
  PROMPT_FILE_LINES: null,
  CATEGORY_LINES: null,
  PROMPTS_JSON_BYTES: null,
  LIBRARY_URL_TAGGED: null,
};

// ---------------------------------------------------------------------------
// ATTRIBUTION.md -- the provenance ledger, and the vehicle for CC BY 4.0
// section 3(a)(1) compliance on the rows we take under that licence.
//
// GENERATED, never hand-maintained: it has one row per published prompt and a
// hand-kept copy would drift the moment a takedown lands. It is also the reason
// `upstreamCreditAsSupplied` exists -- 3(a)(1)(A)(i) asks for the creator
// identification AS THE LICENSOR SUPPLIED IT, and publishing only the X handle
// we parsed out of a URL is not that. All 35 supplied names differ from the
// handle, so this is a real difference, not a formality.
// ---------------------------------------------------------------------------
function renderAttribution() {
  const d = new Doc('ATTRIBUTION.md', 'en');
  d.block('# Attribution and provenance');
  d.block(
    'Every prompt in this repository was written by the person named on its row and first ' +
      'published in the post linked beside it. We wrote none of the prompt text. This file ' +
      'is generated by `scripts/build.mjs` from `data/prompts.json`; do not edit it by hand.',
  );
  d.block(
    `To ask for a prompt to be corrected or removed, see ${d.rel('TAKEDOWN.md', '`TAKEDOWN.md`')}. Quote the slug from the table below.`,
  );

  const directRows = rows.filter((r) => r.upstream === 'direct');
  if (directRows.length) {
    d.block('## Sent in by their authors');
    d.block(
      `${directRows.length} prompt(s) here were submitted by the person who wrote them, with ` +
        'their permission to publish. They did not reach us through any collection, so there is ' +
        'no upstream to pin: the record of what was agreed is on the row itself.',
    );
    d.block(
      ['| Prompt | Slug | Author | Original post | Permission |', '| --- | --- | --- | --- | --- |',
        ...[...directRows]
          .sort((a, b) => cmpU16(a.author.toLowerCase(), b.author.toLowerCase()) || cmpU16(a.slug, b.slug))
          .map((r) => {
            const post = r.sourceUrl ? `[post](${r.sourceUrl})` : '_post deleted_';
            return `| ${esc(r.title)} | \`${r.slug}\` | [@${r.author}](${r.authorUrl}) | ${post} | [granted ${r.consent.grantedAt}](${r.consent.issue}) |`;
          })].join('\n'),
    );
  }

  for (const u of meta.upstreams) {
    const rowsFor = rows.filter((r) => r.upstream === u.id);
    if (!rowsFor.length) continue;
    d.block(`## Received via ${esc(u.repo)}`);
    d.block(
      `${rowsFor.length} of the ${rows.length} prompts here reached us through this collection, ` +
        `which stated \`${u.statedTerms}\` over its own copy. We pin it at commit ` +
        `\`${u.commit.slice(0, 8)}\` (${u.commitDate}) and keep the licence file it shipped at ` +
        `that commit in \`provenance/\`, so what we relied on stays checkable even though the ` +
        `upstream rewrites itself.`,
    );
    d.block(`Licensed material, at the commit we took it from: <${u.permalink}>`);

    if (u.statedTerms === 'CC-BY-4.0') {
      // 3(a)(1)(A)(ii)-(iv) and 3(a)(1)(C), retained verbatim as supplied.
      d.block(
        [
          'Notices retained from that collection, as CC BY 4.0 section 3(a)(1) requires of us:',
          '',
          `> ${u.statedCopyrightNotice}`,
          '>',
          `> Licensed under Creative Commons Attribution 4.0 International (CC BY 4.0), ${u.statedTermsUrl}`,
          '>',
          `> ${u.statedWarrantyNotice}`,
        ].join('\n'),
      );
      d.block(
        `The full licence text is in ${d.rel('LICENSES/CC-BY-4.0.txt', '`LICENSES/CC-BY-4.0.txt`')} ` +
          `and at <${u.statedTermsUrl}>. **We did not modify the prompt text.** Each body is ` +
          'reproduced as we received it; `promptSha256` on every row in `data/prompts.json` is a ' +
          'checksum of exactly what we published.',
      );
    } else {
      d.block(
        `\`CC0-1.0\` asks nothing of a redistributor. We credit these authors anyway, because ` +
          `they wrote the prompts. The full text is in ${d.rel('LICENSES/CC0-1.0.txt', '`LICENSES/CC0-1.0.txt`')}.`,
      );
    }

    const header =
      u.statedTerms === 'CC-BY-4.0'
        ? '| Prompt | Slug | Creator, as supplied | Handle | Original post |'
        : '| Prompt | Slug | Author | Original post |';
    const rule = u.statedTerms === 'CC-BY-4.0' ? '| --- | --- | --- | --- | --- |' : '| --- | --- | --- | --- |';
    // Code units, not localeCompare: an ICU collation makes the byte output
    // depend on the machine's locale, and `verify.mjs` fails the build for it.
    // (tr_TR lowercases 'I' to a dotless 'i', so even the casing must be plain.)
    const key = (r) => (r.upstreamCreditAsSupplied ?? r.author).toLowerCase();
    const body = [...rowsFor]
      .sort((a, b) => cmpU16(key(a), key(b)) || cmpU16(a.slug, b.slug))
      .map((r) => {
        const post = r.sourceUrl ? `[post](${r.sourceUrl})` : '_post deleted_';
        return u.statedTerms === 'CC-BY-4.0'
          ? `| ${esc(r.title)} | \`${r.slug}\` | ${esc(r.upstreamCreditAsSupplied)} | [@${r.author}](${r.authorUrl}) | ${post} |`
          : `| ${esc(r.title)} | \`${r.slug}\` | [@${r.author}](${r.authorUrl}) | ${post} |`;
      });
    d.block([header, rule, ...body].join('\n'));
  }
  return d;
}

// ---------------------------------------------------------------------------
// Render everything in memory, in dependency order.
//   prompt files -> their byte sizes feed the machine-surface block
//   llms.txt     -> its byte size feeds the machine-surface block
//   READMEs      -> nothing depends on their size, so there is no fixed point
// ---------------------------------------------------------------------------

console.log('\nrender');

const outputs = new Map();
const docs = [];

for (const c of categories) {
  const d = renderPromptFile(c);
  docs.push(d);
  outputs.set(d.path, d.text());
}
const sizes = {
  ...Object.fromEntries([...outputs].map(([p, text]) => [p, bytes(text)])),
  'data/prompts.json': restampedJson === null ? fileBytes('data/prompts.json') : bytes(restampedJson),
  'data/prompts.schema.json': fileBytes('data/prompts.schema.json'),
  'data/removed.json': fileBytes('data/removed.json'),
};

const llmsDoc = renderLlms(sizes);
docs.push(llmsDoc);
outputs.set('llms.txt', llmsDoc.text());
sizes['llms.txt'] = bytes(outputs.get('llms.txt'));

const attributionDoc = renderAttribution();
docs.push(attributionDoc);
outputs.set('ATTRIBUTION.md', attributionDoc.text());
sizes['ATTRIBUTION.md'] = bytes(outputs.get('ATTRIBUTION.md'));

const aboutText = fillTemplate(aboutTmpl, TEMPLATE_VARS, 'metadata/about.txt').trim();
outputs.set('metadata/about.txt', aboutText + '\n');

// The degradation ladder: a README over 108,000 B drops its Source column, then
// its Author column. Over 120,000 B after that it fails, and the message states
// its own arithmetic. The budget is SKIPPED when the new file is smaller than
// the committed one — with a plain pre-write check, a corpus that outgrows the
// budget would kill the entire publish pipeline INCLUDING THE TAKEDOWN PATH,
// for a reason that has nothing to do with the takedown.
const LADDER = [[], ['source'], ['source', 'author']];
/** path -> which rung the ladder actually stopped on, so the failure message
 *  below states what happened rather than assuming the ladder ran. Only
 *  README.md carries the row index, so only it can be degraded at all. */
const readmeLadder = new Map();
for (const locale of LOCALES) {
  let d = null;
  let step = 0;
  for (; step < LADDER.length; step++) {
    d = renderReadme(locale, sizes, LADDER[step]);
    if (locale !== 'en' || bytes(d.text()) <= BUDGET.readmeDegrade) break;
  }
  if (step > 0) console.log(`  DEGRADED ${readmePath(locale)}: dropped the ${LADDER[Math.min(step, LADDER.length - 1)].join(' and ')} column(s)`);
  readmeLadder.set(readmePath(locale), { locale, dropped: LADDER[Math.min(step, LADDER.length - 1)], indexRowBytes: d.indexRowBytes ?? 0 });
  docs.push(d);
  outputs.set(d.path, d.text());
  sizes[d.path] = bytes(d.text());
}
console.log(`  ${outputs.size} files rendered in memory`);

const unusedVars = Object.keys(TEMPLATE_VARS).filter((k) => TEMPLATE_VARS[k] !== null && !templateUses.has(k));
if (unusedVars.length) console.log(`  note: ${unusedVars.length} declared placeholder(s) no template used: ${unusedVars.sort(cmpU16).join(', ')}`);

// ---------------------------------------------------------------------------
// Invariants: rendering
// ---------------------------------------------------------------------------

console.log('\nrendering invariants');

// Link graph, validated against what the renderers BUILT.
const anchorsByPath = new Map(docs.map((d) => [d.path, d.anchors]));
const linkProblems = [];
for (const d of docs) {
  for (const { target } of d.links) {
    const [filePart, frag] = target.split('#');
    const abs = filePart === '' ? d.path : relative(ROOT, resolve(ROOT, dirname(d.path), filePart)).split('\\').join('/');
    if (!outputs.has(abs) && !existsSync(join(ROOT, abs))) linkProblems.push(`${d.path} -> ${target} (no such file)`);
    else if (frag) {
      const set = anchorsByPath.get(abs);
      if (!set) linkProblems.push(`${d.path} -> ${target} (target emits no anchors)`);
      else if (!set.has(frag)) linkProblems.push(`${d.path} -> ${target} (no anchor #${frag})`);
    }
  }
}
const totalLinks = docs.reduce((n, d) => n + d.links.length, 0);
const totalAnchors = docs.reduce((n, d) => n + d.anchors.size, 0);
check('every internal link resolves to an emitted anchor', linkProblems.length === 0, linkProblems.length ? linkProblems.slice(0, 4).join(' | ') : `${totalLinks} links, ${totalAnchors} anchors, every id /${ID_RE.source}/`);

// The check above sees only the links a RENDERER built. A content fragment is
// passed through verbatim, so a `](…)` typed by hand inside one is invisible to
// it, and a fragment is exactly where a hand-typed link lands. So read the FINAL
// bytes back, with fenced blocks stripped first: a third-party prompt body
// containing `](brief.md#hero)` is not one of our links, and mistaking it for
// one is what killed a rival's publish. verify.mjs does this too, off disk —
// here it happens BEFORE anything is written.
const rawLinkProblems = [];
let rawLinkCount = 0;
for (const [path, text] of outputs) {
  if (!path.endsWith('.md') && path !== 'llms.txt') continue;
  const prose = stripFenced(text);
  // Markdown links AND raw <a href>: the locale switcher is HTML, so a regex
  // that saw only `](…)` would leave the one link every README carries five of
  // unchecked. verify.mjs reads both; so does this.
  const targets = [
    ...[...prose.matchAll(/\]\(([^()\s]+)\)/g)].map((m) => m[1]),
    ...[...prose.matchAll(/<a href="([^"]+)"/g)].map((m) => m[1]),
  ];
  for (const target of targets) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(target)) continue; // absolute, checked elsewhere
    rawLinkCount++;
    const [filePart, frag] = target.split('#');
    const abs = filePart === '' ? path : relative(ROOT, resolve(ROOT, dirname(path), filePart)).split('\\').join('/');
    if (!outputs.has(abs) && !existsSync(join(ROOT, abs))) rawLinkProblems.push(`${path} -> ${target} (no such file)`);
    else if (frag) {
      const set = anchorsByPath.get(abs);
      if (!set) rawLinkProblems.push(`${path} -> ${target} (target emits no anchors)`);
      else if (!set.has(frag)) rawLinkProblems.push(`${path} -> ${target} (no anchor #${frag})`);
    }
  }
}
check(
  'every link in the final bytes resolves, fragments included',
  rawLinkProblems.length === 0,
  rawLinkProblems.length ? rawLinkProblems.slice(0, 4).join(' | ') : `${rawLinkCount} relative link(s) re-read off the rendered text, fences stripped`,
);

// Every youart.ai URL in the output came out of destination(). The two
// citation-shaped addresses are exempt only where they are NOT a link target:
// a bare mention or an autolink propagates into someone else's file and must
// stay clean, but `](…)` is a click and a click carries its UTM. Without that
// distinction the single URL a person is most likely to paste by hand — the
// canonical one — is the one URL the guard would wave through.
const urlProblems = [];
let urlCount = 0;
let untaggedByDesign = 0;
for (const [path, text] of outputs) {
  for (const m of text.matchAll(/https:\/\/youart\.ai[^\s)"'\]<>]*/g)) {
    urlCount++;
    const asLinkTarget = text.slice(Math.max(0, m.index - 2), m.index) === '](';
    if (!asLinkTarget && UNTAGGED_ALLOWED.has(m[0])) {
      untaggedByDesign++;
      continue;
    }
    if (!emittedDestinations.has(m[0])) urlProblems.push(`${path}: ${m[0]}${asLinkTarget ? ' — untagged as a link target' : ''}`);
  }
}
check('every youart.ai URL came from destination()', urlProblems.length === 0, urlProblems.length ? urlProblems.slice(0, 3).join(' | ') : `${urlCount} URLs, ${emittedDestinations.size} distinct, ${untaggedByDesign} untagged by design and none of them a link target`);

// One campaign, and placements that are actually distinguishable.
const mediums = new Set();
const contents = new Set();
const campaignProblems = [];
for (const u of emittedDestinations) {
  const p = Object.fromEntries(u.split('?')[1].split('#')[0].split('&').map((kv) => kv.split('=')));
  mediums.add(p.utm_medium);
  contents.add(p.utm_content);
  if (p.utm_campaign !== UTM_CAMPAIGN) campaignProblems.push(u);
}
check('one utm_campaign, distinguishable placements', campaignProblems.length === 0 && mediums.size >= 4, `${mediums.size} media (${[...mediums].sort(cmpU16).join(', ')}), ${contents.size} distinct utm_content`);

// Arabic.
const arText = outputs.get(readmePath('ar'));
const arLines = arText.split('\n');
const arBad = [];
arLines.forEach((line, i) => {
  const m = /^\s*(?:[-*+]|\d+\.)\s+(.*)$/.exec(line);
  if (m && needsRlm(m[1])) arBad.push(`line ${i + 1}: ${m[1].slice(0, 40)}`);
});
check('README.ar.md list items carry U+200F where needed', arBad.length === 0, arBad.length ? arBad.slice(0, 3).join(' | ') : `${arLines.filter((l) => /^\s*(?:[-*+]|\d+\.)\s/.test(l)).length} list items checked`);
const arTable = arLines.some((l) => /^\s*\|/.test(l)) || /<table/i.test(arText);
const arQuote = arLines.some((l) => /^\s*>/.test(l)) || /<blockquote/i.test(arText);
check('README.ar.md has no table and no blockquote', !arTable && !arQuote, `table=${arTable} blockquote=${arQuote}`);

// The licence layer is present, so the invariants change shape: instead of
// asserting that no rights prose exists, assert that the obligations we took on
// are actually discharged in the bytes we publish.
const badBadge = [...outputs].filter(([, t]) => /img\.shields\.io\/badge\/[^)]*\b(undefined|null|NaN)\b/.test(t)).map(([p]) => p);
hard('no badge interpolates undefined', badBadge.length === 0, badBadge.length ? badBadge.join(', ') : 'shields URLs carry real values');
const readmePaths = [...outputs.keys()].filter((p) => p.startsWith('README'));
const noRights = readmePaths.filter((p) => !outputs.get(p).includes('ATTRIBUTION.md'));
check('every README points at the attribution ledger', noRights.length === 0, noRights.length ? noRights.join(', ') : `${readmePaths.length} READMEs`);

// CC BY 4.0 3(a)(1)(A)(i): the creator as the LICENSOR supplied them, not the
// handle we parsed out of a URL. All 35 supplied names differ from the handle,
// so a row missing this is a real breach and not a cosmetic one.
const ccby = rows.filter((r) => r.upstreamStatedTerms === 'CC-BY-4.0');
const noSupplied = ccby.filter((r) => !r.upstreamCreditAsSupplied || !String(r.upstreamCreditAsSupplied).trim());
hard('every CC BY row carries the supplied creator name', noSupplied.length === 0, noSupplied.length ? noSupplied.slice(0, 5).map((r) => r.slug).join(' | ') : `${ccby.length} rows, 3(a)(1)(A)(i)`);

// 3(a)(1)(A)(ii)-(iv) and (C): the retained notices and a link to the licence
// text have to reach ATTRIBUTION.md, or we are relying on a grant whose terms
// we are not meeting.
const attrText = outputs.get('ATTRIBUTION.md') ?? '';
const ccbyUpstreams = meta.upstreams.filter((u) => u.statedTerms === 'CC-BY-4.0' && rows.some((r) => r.upstream === u.id));
const missingNotice = [];
for (const u of ccbyUpstreams) {
  if (!attrText.includes(u.statedCopyrightNotice ?? '\u0000')) missingNotice.push(`${u.id}: copyright notice`);
  if (!attrText.includes(u.statedWarrantyNotice ?? '\u0000')) missingNotice.push(`${u.id}: warranty notice`);
  if (!attrText.includes(u.statedTermsUrl ?? '\u0000')) missingNotice.push(`${u.id}: licence URI`);
  if (!attrText.includes(u.permalink ?? '\u0000')) missingNotice.push(`${u.id}: link to the licensed material`);
}
if (ccbyUpstreams.length && !attrText.includes('LICENSES/CC-BY-4.0.txt')) missingNotice.push('link to the licence text');
if (ccbyUpstreams.length && !/did not modify/i.test(attrText)) missingNotice.push('statement that the text is unmodified (3(a)(1)(B))');
hard('ATTRIBUTION.md retains every notice CC BY 3(a)(1) requires', missingNotice.length === 0, missingNotice.length ? missingNotice.join(' | ') : `${ccbyUpstreams.length} upstream, 6 elements`);

// Every published row must appear in the ledger, or someone is credited nowhere.
const unlisted = rows.filter((r) => !attrText.includes(`\`${r.slug}\``));
hard('ATTRIBUTION.md covers every published row', unlisted.length === 0, unlisted.length ? unlisted.slice(0, 5).map((r) => r.slug).join(' | ') : `${rows.length} rows`);

// The vendored evidence and the legalcodes have to exist on disk.
const rightsFiles = ['LICENSE', 'LICENSES/MIT.txt', 'LICENSES/CC-BY-4.0.txt', 'LICENSES/CC0-1.0.txt', 'LICENSES/LicenseRef-Prompt-Authors-No-Grant.txt', 'LICENSES/LicenseRef-YouArt-Curation-No-Grant.txt', 'REUSE.toml', 'TAKEDOWN.md', 'CONTRIBUTING.md', 'provenance/README.md', ...meta.upstreams.map((u) => `provenance/${u.id}-${u.commit.slice(0, 8)}-LICENSE.txt`)];
const absent = rightsFiles.filter((f) => !existsSync(f));
hard('every licence and provenance file is present', absent.length === 0, absent.length ? absent.join(', ') : `${rightsFiles.length} files`);

// Byte budgets.
for (const [path, text] of [...outputs].sort(byKey(([p]) => p))) {
  const n = bytes(text);
  // No committed file means no "shrinking build" exemption.
  const committed = existsSync(join(ROOT, path)) ? fileBytes(path) : 0;
  const shrinking = n < committed;
  if (path.startsWith('README')) {
    const over = n >= BUDGET.readmeFail;
    const spare = BUDGET.readmeFail - n;
    check(
      `${path} under ${num(BUDGET.readmeFail)} B`,
      !over || shrinking,
      over && shrinking ? `${num(n)} B — over budget but SHRINKING, allowed` : `${num(n)} B (${spare >= 0 ? `${num(spare)} B spare` : `${num(-spare)} B over`})`,
    );
    if (over && !shrinking) {
      // State the rung the ladder actually stopped on. Asserting that both
      // columns were dropped is false whenever readmeFail is crossed without
      // readmeDegrade being crossed first, and false for every translated
      // README, which carries no index and so has no columns to drop.
      const lad = readmeLadder.get(path);
      const hasIndex = lad?.locale === 'en';
      const rung = !hasIndex
        ? `this locale carries no row index, so the column ladder does not apply to it`
        : lad.dropped.length
          ? `after the ${lad.dropped.join(' and ')} column(s) were dropped`
          : `with every index column still rendered — the ${num(BUDGET.readmeDegrade)} B degradation trigger was never crossed`;
      const perRow = lad?.indexRowBytes || 0;
      const room = perRow ? Math.floor((BUDGET.readmeFail - n) / perRow) : 0;
      failures.push(
        `${path} is ${num(n)} B against a ${num(BUDGET.readmeFail)} B guard, ${rung}. ` +
          (hasIndex && perRow
            ? `Its index costs ${perRow.toFixed(1)} B/row as rendered, so the file is ${Math.abs(room)} rows ${room < 0 ? 'over' : 'under'}. ` +
              `The next rung is manual: move the index into INDEX.md and link it. `
            : ``) +
          `(${num(BUDGET.readmeFail)} B is headroom, not the cliff: GitHub was seen inlining at 87,682 B and not inlining at 327,044 B.)`,
      );
    }
  } else if (path.startsWith('prompts/')) {
    check(`${path} under ${num(BUDGET.promptFile)} B`, n < BUDGET.promptFile || shrinking, `${num(n)} B`);
  } else if (path === 'metadata/about.txt') {
    check('metadata/about.txt length', aboutText.length <= BUDGET.aboutChars, `${aboutText.length} chars <= ${BUDGET.aboutChars}`);
  } else {
    check(`${path} rendered`, n > 0, `${num(n)} B`);
  }
}

// Determinism: render one document a second time and compare bytes.
const twice = renderPromptFile(categories[0]).text();
check('a second render is byte-identical', twice === outputs.get(promptFilePath(categories[0])), `${num(bytes(twice))} B, sha ${sha256(twice).slice(0, 12)}`);

if (failures.length) {
  console.error(`\n${failures.length} invariant(s) failed; NOTHING WAS WRITTEN:`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Output namespaces. Anything in one of these that we did not just render is
// STALE and is deleted, so dropping a category cannot leave a file on disk with
// seventeen prompt bodies intact while --check and verify.mjs both exit 0.
// data/, content/ and locales/ are INPUT namespaces and are never pruned.
// ---------------------------------------------------------------------------

function listNamespace() {
  const found = [];
  for (const name of readdirSync(ROOT).sort(cmpU16)) if (/^README(\.[a-z]{2})?\.md$/.test(name)) found.push(name);
  const pdir = join(ROOT, 'prompts');
  if (existsSync(pdir)) for (const name of readdirSync(pdir).sort(cmpU16)) if (name.endsWith('.md')) found.push(`prompts/${name}`);
  if (existsSync(join(ROOT, 'llms.txt'))) found.push('llms.txt');
  if (existsSync(join(ROOT, 'metadata/about.txt'))) found.push('metadata/about.txt');
  return found;
}
const extras = listNamespace().filter((p) => !outputs.has(p));

// ---------------------------------------------------------------------------
// Write, or check
// ---------------------------------------------------------------------------

console.log('\noutput');

if (MODE === 'check') {
  const stale = [];
  for (const [path, text] of [...outputs].sort(byKey(([p]) => p))) {
    if (!existsSync(join(ROOT, path))) {
      stale.push(`${path}: MISSING (would write ${num(bytes(text))} B)`);
      continue;
    }
    const cur = readText(path);
    if (cur === text) console.log(`  ok    ${path.padEnd(48)} ${num(bytes(text))} B`);
    else {
      const delta = bytes(text) - bytes(cur);
      stale.push(`${path}: differs — ${num(bytes(cur))} B on disk, ${num(bytes(text))} B rendered, delta ${delta >= 0 ? '+' : '-'}${num(Math.abs(delta))} B`);
    }
  }
  for (const p of extras) stale.push(`${p}: EXTRA — in an output namespace but not rendered; run the build to prune it`);
  if (stale.length) {
    console.error(`\n--check failed: ${stale.length} file(s) out of date.`);
    for (const s of stale) console.error(`  - ${s}`);
    process.exit(1);
  }
  console.log(`\n--check passed: ${outputs.size} generated files on disk match the data.`);
  process.exit(0);
}

if (restampedJson !== null) {
  writeFileSync(join(ROOT, 'data/prompts.json'), restampedJson, 'utf8');
  console.log(`  stamp data/prompts.json${' '.repeat(26)}${num(bytes(restampedJson))} B, ${rows.length} rows`);
}

let written = 0;
for (const [path, text] of [...outputs].sort(byKey(([p]) => p))) {
  const abs = join(ROOT, path);
  mkdirSync(dirname(abs), { recursive: true });
  const changed = !existsSync(abs) || readText(path) !== text;
  if (changed) {
    writeFileSync(abs, text, 'utf8');
    written++;
  }
  console.log(`  ${changed ? 'write' : 'same '} ${path.padEnd(48)} ${num(bytes(text))} B`);
}
for (const p of extras) {
  rmSync(join(ROOT, p));
  console.log(`  prune ${p}`);
}

console.log(
  `\n${checkCount} invariants checked · ${outputs.size} files up to date (${written} written, ${extras.length} pruned) · ` +
    `${num([...outputs.values()].reduce((n, t) => n + bytes(t), 0))} B generated.`,
);
