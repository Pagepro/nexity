# Concepts

Shared domain vocabulary for this project — entities, named processes, and status concepts with project-specific meaning. Starts with the core vocabulary of the starter, then grows as ce-compound and ce-compound-refresh process learnings; direct edits are fine. Glossary only, not a spec or catch-all.

## Sections

### Section
The unit of page composition — a CMS-managed content block. A page holds an ordered list of sections; each section type has its own content model and its own on-page rendering, and editors build a page by choosing and ordering section types.

### Global section
A section the CMS injects before or after a page's own content automatically, by matching the page's URL path — not placed inline by an editor. Used for content that should appear across many pages without being re-added to each.

### Shared section
A reusable bundle of sections authored once and referenced from many pages, so editing the bundle propagates to every referencing page on the next publish. Distinct from a Global section: a Shared section is placed inline by an editor and matched by reference, whereas a Global section appears automatically by URL-path matching.

### First module
The first section in a page's ordered list, rendered specially because the site header is a fixed, transparent overlay. The first module bleeds its background up *under* the header (so the header floats over the section's imagery) while padding its own content down so it still clears the header; every other section renders in normal flow below the header.

## RichText

### Block style
A named style key an editor applies to a RichText block that records editorial *intent* (e.g. "section title", "body copy") rather than concrete CSS. The frontend owns the mapping from each key to its rendered typography, so a key's appearance can be changed globally without touching content, and the same key always means the same thing across pages.

Block styles are partitioned by RichText variant: section text offers the design-system heading scale (a small set of named heading sizes for section titles and hero headlines), while long-form page text offers a full numbered heading hierarchy for document structure. The two sets are intentionally disjoint so an editor cannot pick a document-style heading for a marketing section.
