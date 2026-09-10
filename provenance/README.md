# What is in here, and why

We did not write the prompts in this repository. We received them through two
public collections, each of which stated terms over its own copy. Those
statements are the basis on which we publish, so this directory keeps a copy of
exactly what each one said, taken from the commit we actually took the prompts
from.

| File | Collection | Commit | Stated |
| --- | --- | --- | --- |
| `evolink-e2a269ad-LICENSE.txt` | EvoLinkAI/awesome-gpt-image-2-API-and-Prompts | `e2a269ad` (2026-07-18) | CC0-1.0 |
| `youmind-41572075-LICENSE.txt` | YouMind-OpenLab/awesome-gpt-image-2 | `41572075` (2026-09-09) | CC BY 4.0 |

## Why pin a commit rather than link the repository

Because one of them rewrites itself. YouMind's README is generated twice a day
from a private CMS and shows a rotating window of its corpus, so a link to
"their README" is a link to whatever it says today. Twenty-four of the thirty-five
prompts we took from it are no longer in it. Pinning the commit is the only way
the thing we relied on stays checkable.

EvoLink's collection has not been pushed to since 2026-07-18, so its pin is
stable for a duller reason.

## Why keep their licence files rather than just name them

Two reasons, and the second is the interesting one.

The first is evidence: if anyone asks what we relied on, the answer is a file,
not a memory.

The second is that `youmind-41572075-LICENSE.txt` is **not the CC BY 4.0
licence**. It is 1,364 bytes of the licence *deed* -- the human-readable summary
Creative Commons publishes alongside the real thing -- with a copyright line
added. It contains the word "Section" zero times and the phrase "Licensed
Material" zero times; the actual licence uses both throughout. Compare it with
`../LICENSES/CC-BY-4.0.txt`, which is the real 18,657-byte legalcode.

That does not make the intention unclear -- the file says CC BY 4.0 and links
it -- and we have treated it as the grant it plainly means to be. But it is the
kind of detail that is much easier to check when the file is sitting here than
when it is a line in a commit message.

Neither collection wrote the prompts. Who wrote each one is in
`../ATTRIBUTION.md`.
