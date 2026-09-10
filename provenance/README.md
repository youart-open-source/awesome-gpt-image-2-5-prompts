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

Evidence. If anyone asks what we relied on, the answer should be a file rather
than a memory — including the detail that YouMind's `LICENSE` is the CC BY
*deed* (the human-readable summary) rather than the legalcode, which is easier
to see with the file in front of you than described in a commit message. The
intention is not in doubt: it names CC BY 4.0 and links it, and we have treated
it as the grant it plainly means to be.

Neither collection wrote the prompts. Who wrote each one is in
`../ATTRIBUTION.md`.
