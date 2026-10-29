import type { SectionType } from "./fixtures-registry";

export const SECTION_GROUPS = [
  "Hero",
  "Content",
  "Social proof",
  "Conversion",
  "Listings",
  "Composite",
] as const;

export type SectionGroup = (typeof SECTION_GROUPS)[number];

export interface SectionMeta {
  title: string;
  description: string;
  accepts: string;
  group: SectionGroup;
}

export const SECTION_META: Record<SectionType, SectionMeta> = {
  hero: {
    title: "Hero",
    description:
      "Full-width opening section with headline, supporting copy and CTAs over a background or product image. Use as the first section of a page.",
    accepts: "layout, pretitle, content, ctas, logosTitle, logos, image, productImage",
    group: "Hero",
  },
  content: {
    title: "Content",
    description:
      "Flexible rich-text block with an optional image and CTAs. The general-purpose section for prose and mixed content.",
    accepts: "content, ctas, image, imageLayout",
    group: "Content",
  },
  "feature-block": {
    title: "Feature block",
    description:
      "A single highlighted feature: heading, copy and media side-by-side. Use to spotlight one capability.",
    accepts: "content, image, layout, ctas",
    group: "Content",
  },
  "bento-grid": {
    title: "Bento grid",
    description:
      "Capability overview on a 4-column grid: wide and regular cards, each with an icon, optional stat, title, one-line description and optional link. Use to summarise a product's feature set.",
    accepts:
      "cardStyle, linkStyle, pretitle, content, ctas, cards (size, icon, statLabel, statValue, title, description, link)",
    group: "Content",
  },
  "integrations-grid": {
    title: "Integrations grid",
    description:
      "Filterable grid of Integration documents with category tabs and a search box, plus an optional “View all” link. Tabs come from the picked integrations' categories.",
    accepts:
      "pretitle, content, allLabel, searchPlaceholder, emptyMessage, integrations (references), ctas",
    group: "Content",
  },
  "impact-calculator": {
    title: "Impact calculator",
    description:
      "Interactive ROI estimate: three hairline sliders (team size, deal size, cycle length) drive projected cycle reduction, pipeline recovered and payback. Copy is editable; the model lives in code.",
    accepts: "pretitle, content, input labels, result labels, cta, note",
    group: "Conversion",
  },
  "contact-form": {
    title: "Contact form",
    description:
      "Contact-sales band: heading, copy and a checklist beside a lead form (name, work email, company, team size, message). Submits via a server action.",
    accepts:
      "pretitle, content, bullets, field labels/placeholders, teamSizeField.choices, submitLabel, successMessage",
    group: "Conversion",
  },
  "trust-badges": {
    title: "Trust badges",
    description:
      "A thin, centred row of icon + label claims (compliance, security, uptime) separated by dividers. Use under a testimonial or near a closing CTA.",
    accepts: "badges (icon, label)",
    group: "Social proof",
  },
  "feature-grid": {
    title: "Feature grid",
    description:
      "A 3-up grid of framed cards — eyebrow, headline and image. Each card is written by hand or picked from a Case study document (title, category, date and image pulled in; links to it). Use for capabilities or case-study highlights.",
    accepts: "pretitle, content, cards[] (card | case-study reference)",
    group: "Content",
  },
  "split-sections": {
    title: "Split sections",
    description:
      "Alternating rows of text and media. Use to walk through a sequence of points with supporting visuals.",
    accepts:
      "rows[] (anchor, eyebrow, badge, content, comparison, bulletsTitle, bullets, insight, ctas, proof, image)",
    group: "Content",
  },
  stats: {
    title: "Stats",
    description:
      "A row of headline numbers with labels. Use to convey scale, results or social proof at a glance.",
    accepts: "layout (grid | band), textAlign, content, stats[] (value, label)",
    group: "Content",
  },
  "text-block": {
    title: "Text block",
    description:
      "A centered block of rich text without media. Use for short statements, intros or section dividers.",
    accepts: "textAlign, content, ctas",
    group: "Content",
  },
  faq: {
    title: "FAQ",
    description:
      "An accordion of question/answer pairs. Use to address common objections near the bottom of a page.",
    accepts: "pretitle, content, items[] (question, answer)",
    group: "Content",
  },
  testimonials: {
    title: "Testimonials",
    description:
      "A carousel/grid of customer quotes referenced from reusable testimonial documents. Use for social proof.",
    accepts:
      "layout (carousel | featured), mark, pretitle, content, testimonials[] (references)",
    group: "Social proof",
  },
  "logos-carousel": {
    title: "Logos carousel",
    description:
      "An auto-scrolling strip of customer/partner logos. Use to signal trust with a row of recognizable brands.",
    accepts: "pretitle, logos[] (images)",
    group: "Social proof",
  },
  "cta-banner": {
    title: "CTA banner",
    description:
      "A bold conversion banner with heading, copy, CTAs and an optional image. Use to drive a single action.",
    accepts: "content, ctas, image",
    group: "Conversion",
  },
  newsletter: {
    title: "Newsletter",
    description:
      "An email sign-up block with heading, copy and a subscribe form. Use to capture leads.",
    accepts:
      "layout (banner | centered), content, emailPlaceholder, submitLabel, successMessage, ctas, socialProof, backgroundImage",
    group: "Conversion",
  },
  pricing: {
    title: "Pricing",
    description:
      "Pricing tiers with features and CTAs. Use to present plans and drive plan selection.",
    accepts: "pretitle, content, tiers[]",
    group: "Conversion",
  },
  "comparison-table": {
    title: "Comparison table",
    description:
      "A feature-comparison matrix with a sticky plan-header row and grouped feature rows. Use alongside the Pricing cards to detail what each plan includes.",
    accepts:
      "pretitle, content, plans[] (name, logo, price?, cta), groups[] (title?, rows → cells)",
    group: "Conversion",
  },
  "blog-listing": {
    title: "Blog listing",
    description:
      "The interactive grid of blog posts (search + pagination). Pure grid — heading/intro live on the listing page document.",
    accepts: "—  (data-driven grid)",
    group: "Listings",
  },
  "podcast-listing": {
    title: "Podcast listing",
    description:
      "The episode archive on the podcast page: topic chips, search, stacked rows with number, guest, topic and duration, pagination. Pure list — the show's hero and the latest episode live on the podcast page document.",
    accepts: "—  (data-driven list)",
    group: "Listings",
  },
  "case-studies-listing": {
    title: "Case studies listing",
    description:
      "The interactive grid of case studies with a category filter and featured item. Pure grid — content lives on the listing page document.",
    accepts: "—  (data-driven grid)",
    group: "Listings",
  },
  "shared-section-ref": {
    title: "Shared section",
    description:
      "References one or more reusable shared-section bundles; their inner sections render inline. Edits to a bundle propagate to every reference.",
    accepts: "sharedSections[] (references)",
    group: "Composite",
  },
};
