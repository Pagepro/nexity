import Link from "next/link";

import Sections from "@/ui/sections";

import { Mono } from "../primitives";

import { SECTION_FIXTURES, SectionType } from "./fixtures-registry";
import { PreviewErrorBoundary } from "./preview-error-boundary";
import { ScaledPreview } from "./scaled-preview";
import { SECTION_META } from "./section-meta";
import { SectionUsage } from "./usage";
import { UsageBadge } from "./usage-badge";

const NeedsFixturePreview = () => (
  <div className="flex aspect-[16/10] items-center justify-center rounded-lg border border-dashed border-border bg-muted/50 p-4 text-center">
    <p className="max-w-[18rem] text-12 text-muted-foreground">
      No fixture yet — add a <Mono>gallery-fixture.ts</Mono> next to the component to
      render a live preview.
    </p>
  </div>
);

const PreviewError = () => (
  <div className="flex aspect-[16/10] items-center justify-center rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-center">
    <p className="max-w-[18rem] text-12 text-destructive">
      Preview failed to render. If the image is missing, run <Mono>pnpm seed</Mono>.
    </p>
  </div>
);

// The stretched link is an absolute sibling `<a>`, not a wrapper, so the preview's
// own links never nest inside it.
export const SectionCard = ({
  type,
  usage,
}: {
  type: SectionType;
  usage?: SectionUsage;
}) => {
  const meta = SECTION_META[type];
  const fixture = SECTION_FIXTURES[type];

  const usageCount = usage?.documentTitles.length;

  const usageLabel = !fixture
    ? "needs a fixture"
    : usageCount === undefined
      ? ""
      : usageCount === 0
        ? "not used yet"
        : `used in ${usageCount} ${usageCount === 1 ? "document" : "documents"}`;

  return (
    <article className="group relative flex flex-col rounded-xl border border-border bg-card p-3 shadow-card transition-all focus-within:ring-2 focus-within:ring-ring hover:shadow-xl">
      {fixture ? (
        <PreviewErrorBoundary fallback={<PreviewError />}>
          <ScaledPreview>
            <Sections sections={[fixture]} withDataFirstAttribute={false} />
          </ScaledPreview>
        </PreviewErrorBoundary>
      ) : (
        <NeedsFixturePreview />
      )}

      <div className="mt-3">
        <h3 className="text-14 font-medium">{meta.title}</h3>
      </div>

      <div className="mt-2 text-10">
        <UsageBadge
          count={usageCount}
          hasFixture={Boolean(fixture)}
          documentTitles={usage?.documentTitles}
        />
      </div>

      <Link
        href={`/styleguide/sections/${type}`}
        aria-label={`${meta.title}${usageLabel ? `, ${usageLabel}` : ""}`}
        className="absolute inset-0 z-10 rounded-xl"
      />
    </article>
  );
};
