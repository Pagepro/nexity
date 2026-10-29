import { GroupLabel } from "../primitives";

import { SECTION_TYPES } from "./fixtures-registry";
import { SectionCard } from "./section-card";
import { SECTION_GROUPS, SECTION_META } from "./section-meta";
import { UsageByType } from "./usage";

const groupSlug = (group: string) => group.toLowerCase().replace(/\s+/g, "-");

// Usage is one aggregation fetched once by the route and passed down, never per card.
export const SectionsGallery = ({ usage }: { usage: UsageByType }) => {
  const groups = SECTION_GROUPS.map((group) => ({
    group,
    slug: groupSlug(group),
    types: SECTION_TYPES.filter((type) => SECTION_META[type].group === group),
  })).filter((entry) => entry.types.length > 0);

  return (
    <main className="section py-10 font-sans">
      <header className="pb-6">
        <div className="font-mono text-12 text-muted-foreground/70">/sections</div>
        <h1 className="mt-1 text-30 font-medium tracking-tight">Sections Gallery</h1>
        <p className="mt-2 max-w-2xl text-14 text-muted-foreground">
          Every CMS section type, rendered live from sample content. Browse what a section
          looks like and where it&apos;s already used before inserting it.
        </p>
      </header>

      <nav
        aria-label="Jump to section group"
        className="sticky top-0 z-30 -mx-[var(--section-padding-inline)] flex flex-wrap gap-2 border-b border-border bg-background/85 px-[var(--section-padding-inline)] py-3 backdrop-blur lg:-mx-[var(--section-padding-inline-desktop)] lg:px-[var(--section-padding-inline-desktop)]"
      >
        {groups.map(({ group, slug }) => (
          <a
            key={slug}
            href={`#${slug}`}
            className="rounded-full border border-border px-3 py-1 font-mono text-12 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {group}
          </a>
        ))}
      </nav>

      {groups.map(({ group, slug, types }) => (
        <section key={group} id={slug} className="scroll-mt-16">
          <GroupLabel>{group}</GroupLabel>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {types.map((type) => (
              <SectionCard key={type} type={type} usage={usage[type]} />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
};
