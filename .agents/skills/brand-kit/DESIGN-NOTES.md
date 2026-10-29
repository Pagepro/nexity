# brand-kit HTML view — direction contract

Development-only contract for `html-template.html`. Never copy this into the delivered
HTML (no comments, hidden DOM, or metadata).

THESIS: A brand kit is only worth trusting because every claim walks back to a source.
The surface is a reading instrument with a provenance spine: prose on the left of the
reader's attention, evidence one click away, gaps stated as questions. It refuses the
two defaults: a wall-of-markdown doc export, and a dashboard of stat cards.

OWN-WORLD: A quiet working-tool look: cool
light-grey ground `#f3f4f7`, white work surfaces, 1px `#e1e4ea` borders, Hanken
Grotesk with tabular figures, radius 6px, one blue accent `#1d5fd0` for links,
selection, and active nav. One additional hue only: amber for unresolved things
(conflicting evidence, open gaps). Dark theme mirrors the board's dark palette;
light is default (viewer theme respected per artifact spec).

STORY: A marketer, an editor or the client opens the page, understands who the company is
within one viewport, walks the six kit sections, clicks any number to land on its
evidence row, and ends at the questions only the client can answer.

FIRST VIEWPORT: 52px topbar (tool wordmark, client domain chip, run date, two count
chips: sourced facts, open gaps). 248px left nav: six kit sections, then the appendix (Claims register, Evidence, Gap
questionnaire) with counts. Reading pane opens on Foundations at ~70ch measure.

FORM: Read mode surface inside an established world; precise brief, no concept seed.
Signature interaction: fact links in prose (dotted accent underline) scroll to and
flash their evidence row, and on hover-capable devices show a provenance card (fact,
verbatim quote, source URL) built from the target row — no duplicated data; scrollspy
nav.

FINISH: discharged 2026-09-19. Code-led build; inspected desktop light + dark,
Evidence/Gaps sections, and true-390px mobile (via iframe harness — headless Chrome's
500px minimum window makes direct narrow captures lie). Mechanical detector run once:
real findings (sub-11px tags/headers) fixed; its dark-theme contrast hits are false
positives (it does not resolve CSS custom properties across theme blocks). Fresh-context
finish review returned fix with five material findings (anchor rows landing under sticky
bars; sticky table header a no-op without a scrollport; the audience blocks' accent
left-stripe; missing row hover; click-only flash); all five applied in one batch and
scored resolved; disposition ship. What shipped: `html-template.html` (this world with
content slots).
The template IS the design system here — fills replace slot comments and never restyle.

## Compare surface (`compare-template.html`, added 2026-09-19)

Same world, second surface: a competitive comparison of two finished runs, lens = the
first brand. Inherits every token, the topbar/sidenav shell, tables, `.gap` rows and
amber-for-unresolved; adds only `.duo` (two `surface-2` panels for A/B blocks) and
`.synth` (a synthesis paragraph under each duo). Section order is the argument: Verdict
first (wins / stronger / attack surface / worth adopting as W/L/A/T `.gap` rows), then
Positioning, Proof density, Claims head-to-head, Offer & ICP (service map table +
same-buyer ICP rows), Voice. No evidence table of its own, so no fact tooltips here;
judgements cite run + claim id in text and the topbar chips link both full reports.
Extends the shipped world per the finish-reviewed build; fills replace slots and never
restyle.
