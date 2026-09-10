# Contributing

Thanks for being here. This collection gets better when the people who write
the prompts have a say in it.

## Submit a prompt

Wrote a GPT Image prompt you are happy with? [Send it over.](../../issues/new?template=submit-prompt.yml)

We ask for the prompt, a link to where you posted it, and how you would like to
be credited. One thing we do differently: **we only take prompts from the
person who wrote them.** Not because we are precious about it, but because a
prompt in here carries its author's name, and the only person who can put their
name to something is them.

We read every submission and reply either way, usually within a week. If it
goes in, your row says it is used with your permission.

## Corrections and removals

- **Credit is wrong?** [Tell us.](../../issues/new?template=attribution-correction.yml)
  Wrong name, wrong handle, wrong post — these matter and they are quick to fix.
- **Want your prompt out?** [Ask.](../../issues/new?template=removal-request.yml)
  It goes, and you do not have to explain why. `TAKEDOWN.md` has the detail.

## Bugs and improvements

Dead links, broken anchors, a count that disagrees with itself, a translation
that reads badly — all welcome, as issues or pull requests.

## Working on the repo

Most of the readable files are built rather than edited. `README.md` and its five translations,
`prompts/*.md`, `ATTRIBUTION.md`, `llms.txt` and `metadata/about.txt` all come
from `data/prompts.json`, `locales/*.json` and `content/`:

```sh
node scripts/verify.mjs          # repo invariants
node scripts/build.mjs           # regenerate
node scripts/build.mjs --check   # what CI runs
```

No dependencies, no network, no secrets, no clock — a rebuild on unchanged
input is byte-identical, so a diff always means something really changed. If
you edit `data/prompts.json`, run the build and commit the regenerated files in
the same change so a reviewer reads the same diff a reader will get.
