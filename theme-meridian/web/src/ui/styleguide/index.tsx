import { ColorsSection } from "./sections/colors-section";
import { ComponentsSection } from "./sections/components-section";
import { ElevationSection } from "./sections/elevation-section";
import { LayoutSpacingSection } from "./sections/layout-spacing-section";
import { OverviewSection } from "./sections/overview-section";
import { ShapesSection } from "./sections/shapes-section";
import { TypographySection } from "./sections/typography-section";
import { StyleguideNav } from "./styleguide-nav";
import { DesignTokensModel } from "./use-design-tokens";

export const Styleguide = ({ tokens }: { tokens: DesignTokensModel }) => (
  <>
    <StyleguideNav />
    <main className="section py-10">
      <OverviewSection />
      <ColorsSection tokens={tokens} />
      <TypographySection tokens={tokens} />
      <LayoutSpacingSection tokens={tokens} />
      <ElevationSection tokens={tokens} />
      <ShapesSection tokens={tokens} />
      <ComponentsSection />
    </main>
  </>
);
