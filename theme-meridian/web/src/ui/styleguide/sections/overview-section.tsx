import { DocSection, Mono } from "../primitives";

export const OverviewSection = () => (
  <DocSection
    id="overview"
    number="/0"
    title="Overview & Brand"
    intro="The visual language behind Meridian — read from the app.css source, never hand-copied."
  >
    <div className="max-w-2xl space-y-4 text-14 leading-relaxed text-muted-foreground">
      <p>
        A calm, high-contrast marketing system built on the shadcn "Stone" neutral palette
        and a single typeface,{" "}
        <strong className="text-foreground">Mona Sans SemiExpanded</strong>. The feel is
        confident and editorial: generous whitespace, a 96px vertical section rhythm,
        fully-rounded pill buttons, and restrained accent colour.
      </p>
      <p>
        Colour, type, spacing, radius and elevation are defined as design tokens in{" "}
        <Mono>web/src/styles/app.css</Mono>. This page reads those tokens from the{" "}
        <Mono>app.css</Mono> source, so it always reflects the real system — add a token
        and it appears here automatically.
      </p>
    </div>
  </DocSection>
);
