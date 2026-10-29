# Brand

This file is **who Meridian is and what it says**: the company, its audience, its
voice, its messages, its product facts and the invented world every page reuses.
`DESIGN.md` is how it looks. Together they are the base any person or AI agent
reads before writing copy, building a section, filling a fixture or seeding content.

Meridian is the reference brand of this starter: a fictional B2B SaaS whose content
is demo material (see `AGENTS.md` → "This repo is a TEMPLATE"). Work on the site
treats it as a real company with a consistent invented world, and never presents
its customers, quotes or numbers as real companies or results. A real project
replaces this file section by section, keeping the headings.

> **Using Impeccable?** It keeps its product record in `PRODUCT.md`. On first run
> its `init` interview reads this file and writes `PRODUCT.md` from it. That file is
> derived: when the two disagree, **this file wins**, and a change made here is
> carried over to `PRODUCT.md`, not the other way round.

## Platform

web

## Who we are

**Mission.** Help revenue teams stop arguing from anecdotes and act on the deal
record.

**What Meridian does.** Meridian is a revenue intelligence platform that connects a
company's CRM, sales call recordings and marketing content into one signal: why
deals are won or lost, which content actually closes pipeline, and which accounts
are about to churn. Success is a team that sees risk weeks before a renewal and
knows which asset to send next.

**Positioning.** Meridian generates the data other tools only chart. BI dashboards
plot what the CRM already holds; Meridian produces the win/loss reasons, the
content-to-pipeline attribution and the churn signals from calls, surveys and
content touches, then ships the revenue views built in. Setup is days, not months:
native two-way connectors, no engineering.

## Audience

- **Primary:** revenue leaders in B2B SaaS (CRO, VP Sales, Head of RevOps) who are
  losing deals they expected to win and cannot say why. They arrive from search, a
  referral or a podcast mention, on a laptop between meetings, and decide in a few
  minutes whether this is worth a demo. Success for the site: a booked demo or a
  started free trial.
- **Secondary:** content and marketing leads who need to prove which content moves
  pipeline. Same decision, same CTAs.
- **Not the audience:** the agency team and clients evaluating the starter itself.
  They read `README.md` and `docs/FEATURES.md`, not this file.

## Personality

Meridian sounds like the best RevOps lead the reader has worked with: has the
numbers, says what they mean, and moves on.

| Meridian is | Meridian is not |
|---|---|
| **Direct**: the outcome first, the reasoning after | Breathless: no hype, no "game-changing" |
| **Evidence-led**: a number, an account, a call | Vague: no "insights", "synergies" or "unlock value" without a noun attached |
| **Calm about bad news**: a lost deal is data, not a crisis | Alarmist: no fear-selling about missed quotas |
| **Peer to the reader**: talks to a CRO as an operator | Lecturing: never explains what a pipeline is |
| **Dry, occasionally wry**: one light line per page at most ("Your pipeline shouldn't feel like a desert") | Jokey: no puns in headings, no emoji |

## Voice and tone

**Rules**

1. **Plain, confident, specific.** Numbers over adjectives. Name the account, the
   rep, the stage.
2. **Short.** Headlines under ten words. One idea per sentence. A paragraph is two
   or three sentences.
3. **Active and second person.** "You see which deals are at risk", not "Deals at
   risk can be identified".
4. **No exclamation marks.** No "revolutionary", "seamless", "cutting-edge",
   "leverage", "empower", "next-generation", "AI-powered" as a headline claim.
5. **Sentence case** in headings and buttons. CTA labels are verbs: "Book free demo",
   "Start free trial".
6. **Claims carry their proof.** A figure is followed by its source or scope (see
   the footnote under the homepage stats).

**Tone by context**

| Context | Tone |
|---|---|
| Hero and page headlines | Blunt, outcome-first, a little provocative ("Stop guessing why you lose deals") |
| Feature and section copy | Concrete and procedural: what it does, what you see, how fast |
| Case studies and testimonials | The customer's words, a before/after number, no superlatives added by us |
| Blog and podcast | Practitioner voice, opinions allowed, still no hype |
| Pricing, FAQ, legal, errors | Neutral and exact. Answer first, no persuasion |

**Examples**

| Write | Not |
|---|---|
| See why you lost the Acme renewal, two weeks before it closed. | Unlock powerful AI-driven insights into your revenue. |
| Connect Cumulo and get your first win/loss report in under 24 hours. | Seamless integrations that empower your team! |
| Three of your top ten assets have never touched a closed deal. | Revolutionize your content strategy. |

**Vocabulary**

- **Use:** deals, pipeline, win/loss, signals, champion, renewal, board pack, at-risk,
  stage, rep, account, attribution, forecast.
- **Avoid:** insights (alone), solution, synergy, journey, unlock, supercharge,
  10x, best-in-class, world-class.

## Messaging

- **Tagline:** Stop guessing why you lose deals.
- **One-liner:** Meridian shows revenue teams why deals are won or lost and which
  content moves pipeline.
- **Elevator pitch:** Your CRM tells you what happened, not why. Meridian reads
  your calls, surveys and content touches, and turns them into win/loss reasons,
  content-to-pipeline attribution and churn signals. Connect your CRM in days and
  get your first win/loss report in under 24 hours.
- **Key messages** (one per surface, see Principle 2):
  1. **Know why you win and lose.** Win/loss reasons from the deal record, not from
     rep memory.
  2. **Prove which content closes.** Attribution from asset to pipeline, so
     marketing makes more of what works.
  3. **See risk before the renewal.** Churn and deal-health signals weeks ahead.
  4. **Live in days.** Native two-way connectors, no engineering project.
- **Primary CTAs:** "Book free demo" and "Start free trial", the same pair everywhere.
- **Boilerplate:** Meridian is a revenue intelligence platform for B2B SaaS revenue
  teams. It connects CRM, call recordings and marketing content to explain why deals
  are won or lost, which content drives pipeline and which accounts are at risk.

## Name and logo

- Name **Meridian**, always one word, capital M, never "MeridianAI" or all caps.
- The globe mark and wordmark live in `web/public/meridian-logo.svg` and the Sanity
  site logo. Placeholder brand: a real project renames it (see `AGENTS.md`).
- Colour, type, clear space and every other visual rule: `DESIGN.md`.

## Product facts

**Operating context**

- The site's product screens are HTML mocks of the Meridian app (sidebar, metrics
  strip, performance trend, content attribution, at-risk deals, intelligence feed),
  generated with `tools/product-mocks/` and uploaded to Sanity as PNGs.
- Content is CMS-driven (Sanity). Pages are built from the section types listed in
  `docs/FEATURES.md`; listing pages (blog, case studies, podcast) follow the
  listing-page pattern in `AGENTS.md`.
- Main navigation: Features, Solutions, Enterprise, Resources (Blog, Podcast, Case
  Studies), Pricing, plus Search, Login and "Start free trial". The footer repeats
  Resources with Podcast, Documentation and Changelog.

**Capabilities and claims**

- Capabilities named on the site: Win/Loss Intelligence, Content Attribution,
  Conversation Intelligence, Pipeline Signals, Revenue Dashboards, Integrations
  (40+ connectors: Cumulo, Harborline, Relay, Vista Meet, Frostbase, Quarrystack, Lenswise,
  Outpost Mail, Foliobase, Porchlight …). Personas: Sales, Marketing, RevOps.
- The connectors are invented like everything else: Cumulo and Harborline are the
  CRMs, Relay and Parley the chat tools, Vista Meet the video calls, Callwell the
  call recorder, Frostbase, Quarrystack and Basalt the warehouses, Tributary the
  event pipeline. Never name a real vendor or use its logo.
- Trust claims used: SOC 2 Type II, GDPR ready, SSO/SAML, 99.9% uptime.
- Scale claims used (Features page): 2,400+ revenue teams, $4.2B pipeline
  influenced, 40+ integrations, 9.1/10 satisfaction. Outcome deltas (+43% win rate,
  2.4× pipeline from content) live on the homepage.

**Open decisions**

- Pricing tiers beyond what the Pricing section shows.
- Whether the podcast has its own player or links out (decided per surface).
- **Team count disagrees between surfaces:** the homepage seed says "200+ revenue
  teams" / "200+ mid-market teams", the Features page "2,400+". Pick one and align
  both before adding a new surface that quotes it.

## The invented world

Binding for all copy, fixtures and seed data:

- **Accounts:** Acme Corp, TechStart, Global Finance Ltd, HealthTech Pro, RetailMax.
- **Reps:** Sarah Chen, Marcus Johnson, Emily Rodriguez, David Kim.
- **Customers:** Dana Whitfield, CRO at Finmo, and the testimonial authors in Sanity.
- **Logo row:** Orionbo, Revahub, Starlight, Buzzsnap, Dashstar.

New content reuses these or adds names in the same register. Never a real company,
never a real person.

## Evidence on hand

- Product screens: `tools/product-mocks/` (dashboard, call review, board pack,
  pipeline signals, win/loss review, content attribution, connections, pipeline
  list) and the PNGs in Sanity.
- Customer logos, integration logos, one testimonial avatar and the dune backdrop
  photos in Sanity.
- Fictional testimonials and case studies in Sanity; blog posts in Sanity.
- **Absent, do not fabricate as real:** press, awards, analyst reports, real
  customer names, real benchmarks, real podcast episodes or hosts. A new surface
  that needs them (e.g. a podcast) invents them inside the world above and labels
  nothing as real.

## Principles

1. **Show the deal record, not the dashboard.** Proof is a flagged account, a
   scored call, an attributed asset, with a number attached.
2. **One claim per surface.** Each page or section carries one capability and one
   proof; breadth lives on the homepage, depth on Features.
3. **Days, not months.** Every integration and setup claim stays self-serve and
   concrete; never promise engineering-free magic without naming the connector.
4. **Fiction that holds together.** Names, numbers and dates agree across pages
   and screens; a new page cites the same accounts and reps the dashboard shows.
5. **The reader is busy and senior.** Lead with the outcome, keep copy short, keep
   the CTA pair (demo, trial) the same everywhere.
