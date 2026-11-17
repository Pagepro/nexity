# BRAND.md template

Everything above the `---` rule, including this paragraph, is instruction and must NOT
appear in the output. The output file starts with `# Brand`, then the sections below in
this order. The headings are the ones every Nexity project's `BRAND.md` uses, and other
skills (`create-section`, `generate-alts`, the blog skills) read them by name: keep them
exactly. Two headings of the starter's template are left out on purpose, because they
say nothing about a real company read from its site: "Platform" and "The invented
world" (its one useful rule is the first line under "Evidence on hand"). Replace every `<...>` placeholder and never leave one behind.

Empty fields: a field with nothing to put in it is left out, the whole line or, for
"Principles", the whole section. It gets one row in the last section, "To fill in",
and nothing else: no note inside the section, no reason of your own for the gap. The
file a writer reads holds what is known; the list at the end holds what is missing.

Length: the whole file stays under 200 lines, not counting "Open decisions" (never cut
an open decision to fit). A field has the limit its placeholder
states. What does not fit lives in `evidence.md`, not here.

Sources: a claim under "Product facts" ends with the path of its evidence row, copied
from the row, in parentheses.
The other sections carry no ids and no links, so the file reads cleanly for people and
agents; `evidence.md` is the audit trail.

---

# Brand

This file is **who <Company> is and what it says**: the company, its audience, its
voice, its messages and its product facts. `DESIGN.md` is how it looks. Any person or
AI agent reads both before writing copy, building a section or importing content.

Drafted by the `brand-kit` skill on <run date> from <N> public pages of <domain>.
Lines marked "from the team" hold answers the team gave; the rest comes from the public
record. Evidence: `.brand-kits/<slug>/evidence.md`.

## Who we are

**Promise.** <One sentence: what changes for the customer. The site's own sentence,
quoted, or the team's answer. Never derive one: with neither, leave the line out.>

**What <Company> does.** <Two or three sentences: the product or service, who uses it,
what success looks like for them.>

**Positioning.** <One or two sentences: what the company does that the alternatives
don't, and the one proof point that backs it. The proof point must be usable (see
"Capabilities and claims").>

**What <Company> does not do.** <One sentence, in the site's own words when it says so.
Omit the line when the public record is silent and the team has not answered.>

## Audience

<2 to 4 entries, never a demographic bucket. A business buyer is a role in a situation.
A consumer is a person at a moment: the occasion and the need.>

- **Primary: <role and situation, or person and moment>.** <Two sentences: what they
  inherited, outgrew or are about to do, and what brings them to the site.> In their words: "<one verbatim sentence from a
  customer, or one the site quotes>" (<role and company, or first name and review
  platform; source>). Needs to see: <what earns their trust>. Buys: <offer rows>.
- **Secondary: <role and situation>.** <Same shape.>
- **Not the audience:** <who the site is not written for, from the site's own "not for"
  statements. When a statement covers one product line only, say which.>

<A sentence with no evidence row ends with "(inferred)". One per audience at most,
not counting "Needs to see", which is your reading unless a customer said it.>

## Personality

<From the team. One sentence: who the brand sounds like. Then the table, three rows.
When the team has not answered, write one sentence derived from the voice samples,
end it with "(read from the site, not confirmed)", and leave the table out.>

| <Company> is | <Company> is not |
|---|---|
| <trait>: <what it looks like in copy> | <the failure mode of that trait> |

## Voice and tone

**Rules** (four to six, found in this brand's own best writing, each specific enough to
check a sentence against)

1. <e.g. Every result names its measuring tool and its date.>
2. <…>

**Examples** (both columns are verbatim sentences from the site)

| Write | Not |
|---|---|
| "<a strong sentence>" (<page>) | "<a weak sentence>" (<page>) |

**Vocabulary**

- **Use:** <the words customers and the site use for the product and its results;
  product names with their exact capitals>
- **Avoid:** <the filler words this site overuses, with counts; devices the team has
  ruled out>

**Pages to imitate:** <2 to 4 paths>. **Pages to rewrite first:** <2 to 4 paths>.

General rules against AI writing habits are not repeated here: run the
`work-humanizer` skill on a draft.

## Messaging

- **Tagline:** <the site's hero line, verbatim. Leave the line out when the sweep did
  not capture it.>
- **One-liner:** <what it is and who it is for, 30 words at most; the company's own
  sentence when the site has one>
- **Key messages** (three or four, one per page or section, each with proof a writer
  may repeat):
  1. <message>: <its proof>
- **Primary CTAs:** <the labels the site uses most, verbatim. Same rule.>
- **Boilerplate:** <the "about us" paragraph, 60 words at most, with no conflicted
  figure in it>

## Name and logo

- Name **<Company>**: <how the site writes it, and the variants found. No rule about
  capitals or spacing unless the site or the team states one>.
- Product names: <one official form per product, and the variants found>.
- Logo files and every visual rule: `DESIGN.md`.

## Product facts

**Offer** (the main one first, in the shape the company sells in: service lines, plans,
categories with one or two named products, services with area and hours, or programmes)

- **<Row>:** <what the buyer gets, for whom>. <Published price or price range, or "no
  published price">.
- **<What applies to every purchase>:** <delivery and returns, contract term, opening
  hours, as the site states them. Leave the line out when the site states none.>

**Capabilities and claims** (usable today; each ends with its source path)

- <claim> (<path>)

**Open decisions** (do not use until settled)

- <Every conflict, including the ones marked "Fix now", since the old value is still
  live: C1. The conflict in one line, with both values. Until settled, write: <the safe
  wording>.>
- <Every `tension` claim: both figures and the safe wording.>
- <Every `unverified` claim a writer would reach for, each with its question number
  when one exists.>

## Evidence on hand

Examples, fixtures and sample copy take their customers and figures from this list,
never invented ones.

- <real assets content may use: case studies with numbers, named testimonials, review
  profiles, partner listings, each with its path or URL>
- **Absent, do not fabricate:** <what the research looked for and found does not exist
  on the public record>
- **Exists, not read in this run:** <what is there and the sweep could not read: a
  blocked review page, a profile behind a login>

## Principles

<From the team: two or three rules that decide between two drafts of the same page.
When the team has not answered, leave the whole section out, heading included.>

## To fill in

<Leave the section out when nothing is missing. One line per field left out above, in
file order: the field, then who can supply it or where to copy it from. Add "(question
N)" only when row N of `gap-questionnaire.md` asks exactly this. Open facts are not
repeated here: they are under "Open decisions".>

- **<Field>** (<section>): <the team | copy it from <page> | read <source>>.
