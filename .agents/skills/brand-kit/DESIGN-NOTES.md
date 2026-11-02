# brand-kit HTML view — direction contract

Development-only contract for `html-template.html`. Never copy this into the delivered
HTML (no comments, hidden DOM, or metadata).

THESIS: A brand kit is only worth trusting because every claim walks back to a source.
The surface is a reading instrument with a provenance spine: prose on the left of the
reader's attention, evidence one click away, gaps stated as questions. It refuses the
two defaults: a wall-of-markdown doc export, and a dashboard of stat cards.

OWN-WORLD: nexity.build's DESIGN.md (2026-11-02), so the report reads as a Nexity Skills
deliverable: dark ground `#0A0A0A`, `#171717` card surfaces, text `#FAFAFA` / `#A1A1A1` /
`#8A8A8A`, 1px hairlines in white at 10%, no shadows. Libre Caslon Text 400 for headings,
figures, group labels and verbatim voice quotes; Inter 350 for text; Geist Mono for ids,
source paths and the skill name. Pills for controls and chips, 14px radius for frames, a
3px ring at 30% for focus, selection in `--fg`. No accent hue: the one colour is the
system's destructive red, for conflicts and tension only. Open gaps are neutral questions.
Print turns light. The Nexity wordmark sits in the topbar and in the footer ("Made with
Nexity Skills", linking nexity.build).

STORY: A marketer, an editor or someone from product or sales opens the page, understands who the company is
within one viewport, walks the five kit sections, clicks any number to land on its
evidence row, and ends at the questions only the company's own people can answer.

FIRST VIEWPORT: 56px topbar (Nexity wordmark + "Skills", the `/brand-kit` pill, run date).
240px left nav: five kit sections, then the appendix (Claims register, Evidence, Gap
questionnaire) with mono counts and a dot on the active item. The reading column opens on
a masthead: "<company> brand kit" in Caslon at 60px, one line with the domain, then four figures
(facts with a source, audiences, conflicts, open questions), each linking to its
section. Column max 880px, prose at ~68ch.

FORM: Read mode surface inside an established world; precise brief, no concept seed.
Signature interaction: fact links in prose (dotted hairline underline) scroll to and
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
content slots). Re-skinned 2026-11-02 to the Nexity world above: slots, tokens, class
names and scripts unchanged, group labels in sentence case; checked desktop and 390px,
detector run once (contrast fix for small faint text; print-token contrast hits are false
positives).
The template IS the design system here — fills replace slot comments and never restyle.

## Compare surface (`compare-template.html`, added 2026-09-19)

Same world, second surface: a competitive comparison of two finished runs, lens = the
first brand. Inherits every token, the topbar/sidenav shell, tables, `.gap` rows and
red-for-conflict, with a masthead naming both brands and linking both full reports; adds only `.duo` (two `surface-2` panels for A/B blocks) and
`.synth` (a synthesis paragraph under each duo). Section order is the argument: Verdict
first (wins / stronger / attack surface / worth adopting as W/L/A/T `.gap` rows), then
Positioning, Proof density, Claims head-to-head, Offer & ICP (service map table +
same-buyer ICP rows), Voice. No evidence table of its own, so no fact tooltips here;
judgements cite run + claim id in text and the masthead links both full reports.
Extends the shipped world per the finish-reviewed build; fills replace slots and never
restyle.
