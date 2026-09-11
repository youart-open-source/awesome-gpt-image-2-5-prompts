# Removals and corrections

If you wrote one of these prompts and you want it removed, we will remove it.
You do not have to explain why, and you do not have to prove anything to us
beyond being reachable at the account the prompt is credited to.

## Asking for a removal

Open a [removal request](../../issues/new?template=removal-request.yml), or
email support@youart.ai with `[Takedown]` in the subject if you would rather
not do it in public.

Tell us the **slug** of the prompt -- the `id` in its heading, e.g.
`monochrome-hermes-inspired-avatar`. Slugs are unique and stable. Please do not
use row numbers: they shift every time anything is removed, so a number that
means one prompt today means someone else's tomorrow.

If you are the credited author, saying so from the credited account is enough.
If you hold rights but are not the credited account -- you are the photographer
behind a reference image, or the prompt was reposted from you -- tell us what
you hold and how it relates to the row, and we will work it out with you rather
than requiring paperwork first.

## What we do

A removal is a real deletion, not a hidden flag:

1. The prompt's X post id goes into `data/removed.json`.
2. `node scripts/build.mjs` then **fails, writing nothing**, while the row is
   still in the corpus. That is deliberate: a tombstone that has not been
   honoured stops the repository publishing at all.
3. `node scripts/build.mjs --restamp` deletes the row from
   `data/prompts.json`, rebuilds every file, and restamps every count. The
   prompt, its title and its slug are then absent from the corpus, from
   ATTRIBUTION.md, from the category file, from every README and from
   llms.txt.

Two things about that mechanism you should know rather than discover:

**One post can back several prompts.** Removal is keyed on the X post, so if
you published more than one prompt in a single post, all of them go. We think
over-removal is the right direction, but it is worth saying out loud.

**One row cannot be reached by that key.** The post behind
`urban-fantasy-coexistence-crossing` has been deleted, so we have no id to key
on. That row is removed by deleting it directly; the outcome is the same.

## What we cannot do

We can remove a prompt from this repository going forward. We cannot reach into
copies that already exist, and it would be dishonest to imply otherwise:

- **Forks.** A fork is someone else's repository. Nothing we do touches it.
- **Clones and archives.** Anyone who cloned this has the whole history, and
  services like Software Heritage archive public repositories automatically.
- **Old commits.** Even after a force-push, GitHub keeps orphaned commits
  reachable by their SHA; removing them requires GitHub Support, not us.

So we do not promise a history purge, because we cannot deliver one. What we
promise is that the current repository stops publishing your work.

## Corrections

If the credit is wrong -- wrong name, wrong account, wrong post -- open an
[attribution correction](../../issues/new?template=attribution-correction.yml).
Getting the credit right matters more to us than getting it fast, and a
correction is cheaper for everyone than a removal.

## Who to write to

Write to us directly — there is no intermediary here. Everything in this
repository was either collected by us or sent in by the person who wrote it,
and either way `support@youart.ai` reaches the people who can remove it.
