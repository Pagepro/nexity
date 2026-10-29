---
name: brand-kit
description: Use when asked to build, generate, or reverse-engineer a brand kit, brand foundations, brand voice profile, or content-platform onboarding profile for a company from its website URL — "zrób brand kit", "brand kit for <company>", "what data do we need from this client", or when preparing a prospect for AI content production. Needs only a public URL to start. Also a starting point for the project's `BRAND.md`.
---

# Brand Kit Generator

Reverse-engineer a complete brand kit for any company from public sources alone: the six
sections Foundations, Brand Voice & Tone, Author Persona, Global Writing Rules,
Audiences, and Product Lines, in the exact structure of `template.md` (same directory as
this skill). The second deliverable is a **gap questionnaire**: the short list of
questions the client must answer because no public source could.

**Core principle: nothing enters the kit without a source.** Every number, client name,
partnership, and claim in the kit must appear in `evidence.md` with the URL it came
from. A fact you cannot source goes to the gap questionnaire, never into the kit. A kit
with honest gaps beats a fluent kit with invented retention rates.

## 0. Setup

Input: the client's website URL. That is all that's required; extra materials (decks,
docs) are welcome additions to the evidence base.

Create the run directory: `.brand-kits/<client-slug>/` in the project root (slug = bare
domain without TLD, e.g. `acme`). All outputs land there. It is working material about a
client: add `/.brand-kits/` to the project's `.gitignore` if it is missing. If the
directory already exists from a previous run, ask whether to refresh (overwrite) or stop.

When the client is the company that owns the project, its own materials (case studies,
internal docs the user hands over) count as sources too; cite them in `evidence.md` like
any page.

In a project that keeps its voice in a `BRAND.md` (a Nexity project does), the kit is the raw material for it. Offer to
fill `BRAND.md` from it at the end; never overwrite an existing `BRAND.md` without asking.

## 1. Research sweep

Collect raw material into `evidence.md` before writing a single kit sentence. Sweep, in
order:

1. **The site itself**: homepage, about/company page, every service or product page
   (walk the main navigation and the footer — the footer often lists lines the nav
   hides), pricing page, careers page (team size, locations), contact/legal pages
   (entity, addresses, years).
2. **Writing samples for voice**: 3–5 blog posts (prefer recent + most-linked), 2–3 case
   studies. Save 5+ verbatim sentences that show how the brand actually writes: openers,
   how they state numbers, how they name the reader's problem. Also note the jargon on
   the marketing pages ("seamless", "cutting-edge"...) — the voice section reports the
   gap between the best writing and the sales surface.
3. **Third-party proof**: Clutch and/or G2 profile (rating, review count, rankings),
   partner directories (official partner statuses), LinkedIn company page (headcount
   range, founding year), press or award pages.
4. **Search backfill**: `"<brand>" review`, `"<brand>" case study`, `"<brand>" partner`
   — for anything the sweep above missed.

`evidence.md` is a markdown table, one row per fact:

```
| Fact | Source URL | Verbatim quote or number |
|---|---|---|
```

Plus three more sections: `## Sources checked` — one line per page actually fetched
during the sweep (URL + what it yielded, including "nothing"), so the report can show
what was looked at, not only what stuck; web searches that yielded a fact without a page
fetch get one prose line at the end of that section (they are not chips and don't count
toward `{{SOURCE_COUNT}}`, which counts pages only); `## Voice samples` holding the verbatim
sentences with their URLs; and `## Not fetched / not found` for pages that failed or
facts you looked for and couldn't find.

Fetching gotcha: on JS-rendered sites the agent's fetch tool may return only the page
`<title>`. Don't retry it in a loop — fall back to `curl -sL <url>` via Bash and strip the HTML. Skip any
URL that doesn't respond promptly; log it under "Not fetched" and move on.

Budget: the sweep is done when new pages stop yielding new facts, typically 15–25 pages.
Log what you could NOT find as you go — that list becomes §4.

## 2. Voice analysis

From the voice samples (never from your impression of the industry), write a
`## Voice analysis` section at the end of `evidence.md` covering: sentence length and
register; how claims are backed (numbers? named clients? cited sources?); recurring
phrases worth quoting; where the strongest writing lives; which words from the template's
banned list the brand itself overuses. These notes feed the Brand Voice & Tone and Author
Persona sections and any client-specific writing rules.

## 2b. Claims register

From `evidence.md`, extract every checkable factual claim the company makes publicly
into `claims.md`: conflicts first (numbered C1..; a conflict = sources state different
values), then a table of the NON-conflict claims
`| claim | on record / note | status | evidence refs |` with status one of:
`tension` (figures that collide when cited together, e.g. two counts with undefined
denominators), `unverified` (a strong claim with no named source), `third-party` (stated
only off-site, e.g. a Clutch listing), `corroborated` (2+ independent sources agree),
`single source`. A claim lives in the C-list or the table, never both (the HTML's
`{{CLAIM_COUNT}}` is their sum, so duplication double-counts). Every conflict must map
to a gap-questionnaire question or name its concrete fix. This file is what the client
resolves first; the kit's "do not reuse conflicting figures" rule and §4 both draw on it.

## 3. Generate the kit

Write `brand-kit.md` by filling `template.md` top to bottom. The template's placeholder
comments are the per-section spec — follow them exactly. Rules that override fluency:

- The Global Writing Rules base block is copied verbatim from the template for every
  client; only the optional client-specific rules vary.
- Every audience maps to at least one product line and vice versa; flag mismatches in
  the gap questionnaire instead of papering over them.
- Write the kit in English regardless of the client's site language, unless asked
  otherwise.
- The kit's own prose must obey the writing rules it contains (no "seamless", no
  fabricated ranges, no rule-of-three padding). Verbatim quotes from the client's writing
  are evidence and stay untouched even when they break a rule; punctuation the templates
  themselves mandate (the `# Brand kit — <name>` title) is exempt.
- When the client's strongest writing itself relies on a device the base rules ban
  (signature em dashes, negative parallelism), keep the base rule in the kit and add a
  question to the gap questionnaire — the client decides whether their signature device
  overrides AI-tell hygiene.

## 3b. HTML view

Render the kit as a single self-contained page from `html-template.html` (same directory
as this skill; its design is documented in `DESIGN-NOTES.md` — do not restyle it, fill it):

1. Copy the template to the run directory as `brand-kit.html` and replace every
   `{{...}}` token: `{{CLIENT_NAME}}`, `{{CLIENT_DOMAIN}}`, `{{RUN_DATE}}`,
   `{{FACT_COUNT}}`, `{{GAP_COUNT}}`, `{{AUDIENCE_COUNT}}`, `{{PRODUCT_COUNT}}`,
   `{{SOURCE_COUNT}}` (pages under evidence.md's `## Sources checked`),
   `{{CONFLICT_COUNT}}`, `{{CLAIM_ROW_COUNT}}` (claims.md conflicts / table rows) and
   `{{CLAIM_COUNT}}` (their sum).
2. Fill each `<!-- SLOT: ... -->` region with the corresponding content from
   `brand-kit.md`, `evidence.md` and `gap-questionnaire.md`, using only the markup
   patterns the template's slot comments show (`.prose p`, `.field`, `.rulegroup`,
   `.aud`, `.sub`, evidence `<tr id="eN">`, `blockquote`, `.gapgroup`/`.gap`).
3. Provenance links are the point of the page: wrap every claim in the kit prose that
   has an evidence row in `<a class="fact" href="#eN">...</a>`, where `eN` is that
   row's id (rows are numbered in evidence order). Tag evidence rows that record a
   public contradiction with `<span class="tag">conflict</span>` after the fact text.
4. Self-check before publishing: no `{{` or `SLOT:` left in the file; every
   `href="#e..."` resolves to an existing row id (grep both sides); the nav counts
   match the real section counts.

If your agent can publish an artifact (Claude's Artifact tool), publish `brand-kit.html`:
favicon `📇`, title from the file's `<title>`. First publish of a client gets a new URL; a
refresh passes the existing artifact URL as `url` so the link stays stable. The artifact
is private until the user shares it — say so when handing over the link. Without an
artifact tool, the handover is the local file: give its path and suggest opening it in a
browser.

## 4. Gap questionnaire

Write `gap-questionnaire.md`: the questions only the client can answer, grouped, each
with one line on why it matters for content. Typical gaps (ask only what the research
actually failed to answer):

- **Proof metrics**: client retention, NPS, project counts, internal benchmarks.
- **Positioning choices**: what they deliberately don't do; which service is the
  flagship; the "we believe X" behind each line.
- **Flagship engagements**: the one project with numbers they want content anchored to,
  and what may be said publicly about it.
- **Audience priorities**: which of the audiences found is the growth priority; any
  audience they serve but don't advertise.
- **House writing rules**: banned words, naming conventions, claims legal won't allow.

Keep it under ~15 questions. This file is the direct answer to "what data do we need
from a potential customer": a URL up front, and afterwards only the gaps.

## 5. Self-check before delivering

1. **Source audit**: grep `brand-kit.md` for every digit-bearing claim; each must have a
   matching `evidence.md` row (numbers must match the evidence exactly; surrounding prose
   may paraphrase). Remove or move to the questionnaire anything unmatched. Exempt:
   fit-criteria thresholds you authored in ICP sections ("10+ editors") — they are
   guidance, not claims about the client; keep them clearly round.
2. **Template audit**: the file starts with `# Brand kit — <Brand Name>` (the template's
   instruction preamble must not appear), all six sections present, italic helper lines
   intact where the template has them, no `<...>` placeholder left.
3. **Rules audit**: the kit passes its own Global Writing Rules.

Deliver: the HTML view (artifact link, or the file path), the primary handover surface; paths to
`brand-kit.md`, `claims.md`, `gap-questionnaire.md`, `evidence.md`, plus a 5-line
summary of the strongest findings, the conflict count, and the top 3 gaps. Do not paste
the whole kit into chat.

## 6. Compare mode

`brand-kit compare <slug-a> <slug-b>` (`/brand-kit compare …` in Claude Code) — a competitive comparison of two finished runs,
judged through slug-a's lens (slug-a is "us"). Both `.brand-kits/<slug>/` runs
must exist; generate any missing one with the normal pipeline first. The comparison is
**internal working material**, never client-facing.

1. Read both runs' `brand-kit.md`, `claims.md`, `evidence.md`, `gap-questionnaire.md`.
2. When slug-a is the user's own company, ask for any internal competitive notes and
   cite them like evidence.
3. Write `.brand-kits/<a>-vs-<b>/comparison.md` covering, in order: verdict
   (wins / where they're stronger / attack surface, i.e. their conflicted or unverified
   claims / worth adopting), positioning head-to-head, proof density (counts from both
   claims registers), claims head-to-head (shared categories, both values, who is
   better evidenced **on the record**), service map (line-by-line: head-to-head /
   only-us / only-them, packaging differences), ICP overlap (same-buyer collisions
   first), voice. Every judgement cites the underlying claim or evidence entry by id
   and run (`acme e13`).
4. Fill `compare-template.html` (same directory as this skill) exactly as §3b fills the
   kit template: replace `{{A_NAME}}`, `{{A_DOMAIN}}`, `{{B_NAME}}`, `{{B_DOMAIN}}`,
   `{{RUN_DATE}}`, `{{H2H_COUNT}}`, and `{{A_ARTIFACT_URL}}` / `{{B_ARTIFACT_URL}}`
   (each run's published report link, or `../<slug>/brand-kit.html` without an artifact
   tool), fill every `<!-- SLOT: ... -->`, run the same self-check, write
   `.brand-kits/<a>-vs-<b>/comparison.html`, and publish it like §3b (favicon `📇`,
   stable URL on refresh) when the agent can.
5. Deliver: the comparison (link or path), both report links or paths, `comparison.md` path, and
   a 5-line verdict summary in chat.

## Common mistakes

| Mistake | Fix |
|---|---|
| Writing the About section from industry knowledge | Only facts with an `evidence.md` row enter the kit |
| Describing voice with adjectives ("professional, friendly") | Quote real sentences; derive the description from them |
| Inventing audiences to fill the section | 2 well-evidenced audiences beat 4 guessed ones |
| Padding the questionnaire with nice-to-knows | Ask only what research failed to answer, cap ~15 |
| Polishing the client's jargon into the kit | The voice section reports jargon; the kit's own prose avoids it |
