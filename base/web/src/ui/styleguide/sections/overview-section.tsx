import { DocSection, Mono } from "../primitives";

export const OverviewSection = () => (
  <DocSection
    id="overview"
    number="/0"
    title="Overview & Brand"
    intro="The visual language behind this site — read from the app.css source, never hand-copied."
  >
    <div className="max-w-2xl space-y-4 text-14 leading-relaxed text-muted-foreground">
      <p>
        A neutral starting point: Tailwind&apos;s <Mono>neutral</Mono> palette,
        Tailwind&apos;s default radius and shadow scales, and a single typeface,{" "}
        <strong className="text-foreground">Inter</strong>. Replace it with your own
        design system: the tokens in <Mono>app.css</Mono>, the font in{" "}
        <Mono>ui/fonts.ts</Mono> and the rules in <Mono>DESIGN.md</Mono>.
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
