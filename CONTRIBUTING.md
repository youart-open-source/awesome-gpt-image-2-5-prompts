# Contributing

## Everything readable here is generated

`README.md` and its five translations, `prompts/*.md`, `ATTRIBUTION.md`,
`llms.txt` and `metadata/about.txt` are all written by `scripts/build.mjs` from
`data/prompts.json`, `locales/*.json` and `content/`. Editing a generated file
by hand will be overwritten, and CI will notice before that:

```sh
node scripts/verify.mjs          # repo invariants
node scripts/build.mjs           # regenerate
node scripts/build.mjs --check   # what CI runs: fails if the tree is stale
```

No dependencies, no network, no secrets, no clock. A rebuild on unchanged input
is byte-identical, so a diff always means something changed.

## We are not accepting prompt submissions

Deliberately, and it is worth explaining rather than just closing issues.

A submission form asks someone to paste a prompt, name its original author, and
tick a box licensing it. If the submitter is not the author -- and the form has
just asked them who the author is -- that box grants nothing. Both collections
upstream of us run exactly this form. Between them they have processed a
combined total of zero accepted submissions.

Accepting third-party uploads would also change what this repository is. Right
now everything here was put up by us, which is what lets `TAKEDOWN.md` say
plainly who to write to.

**If you wrote a prompt and want it added**, open a blank issue and say so. We
will ask you to confirm it in writing, and the row will say it is used with
your permission -- which is worth considerably more than a ticked checkbox.

## What we do want

- **Removals.** [Removal request](../../issues/new?template=removal-request.yml).
  If it is your prompt, it goes. See `TAKEDOWN.md`.
- **Attribution corrections.** [Correction](../../issues/new?template=attribution-correction.yml).
  Wrong name, wrong account, wrong post -- these matter and they are cheap to fix.
- **Bugs in the build.** A dead link, a broken anchor, a count that disagrees
  with itself.

## If you are changing data/prompts.json

Run `node scripts/build.mjs` and commit the regenerated files in the same
change, so a reviewer reads the same diff a reader will get. If you removed a
row, use `--restamp`, which is also what rewrites the counts and the corpus
checksum.
