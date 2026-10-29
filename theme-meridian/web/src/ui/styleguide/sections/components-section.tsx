import Button from "@/ui/components/button";
import { BUTTON_SIZES, BUTTON_VARIANTS } from "@/ui/components/button/types";

import { DocSection, GroupLabel, Mono } from "../primitives";

const DARK_CONTEXT_VARIANTS = new Set(["light", "light-outline"]);

const labelFor = (variant: string): string => {
  if (variant === "arrow-link" || variant === "link") return "Read the docs";
  return "Start free trial";
};

const VariantRow = ({ variant }: { variant: (typeof BUTTON_VARIANTS)[number] }) => (
  <div className="grid grid-cols-[150px_1fr] items-center gap-6 border-t border-border py-4 first:border-t-0">
    <Mono className="text-muted-foreground">{variant}</Mono>
    <div className="flex flex-wrap items-center gap-3">
      {BUTTON_SIZES.map((size) => (
        <Button key={size} variant={variant} size={size}>
          {labelFor(variant)}
        </Button>
      ))}
    </div>
  </div>
);

export const ComponentsSection = () => {
  const lightVariants = BUTTON_VARIANTS.filter(
    (variant) => !DARK_CONTEXT_VARIANTS.has(variant),
  );
  const darkVariants = BUTTON_VARIANTS.filter((variant) =>
    DARK_CONTEXT_VARIANTS.has(variant),
  );

  return (
    <DocSection
      id="components"
      number="/6"
      title="Components"
      intro="Rendered from the real Button components — every variant × size, so the gallery is never stale."
    >
      <GroupLabel>Buttons · on light surface</GroupLabel>
      {lightVariants.map((variant) => (
        <VariantRow key={variant} variant={variant} />
      ))}

      <GroupLabel>Buttons · on dark surface</GroupLabel>
      {/* A genuinely dark surface (bg-foreground) WITHOUT the .dark class — the
          light/light-outline variants are background-based (white), so flipping
          tokens via .dark would render them invisibly dark-on-dark. */}
      <div className="rounded-xl bg-foreground p-6">
        {darkVariants.map((variant) => (
          <VariantRow key={variant} variant={variant} />
        ))}
      </div>

      <p className="mt-6 max-w-2xl text-12 text-muted-foreground">
        Variants come from <Mono>BUTTON_VARIANTS</Mono> in <Mono>button/types.ts</Mono>.
        Cards / containers are section-internal patterns (e.g.{" "}
        <Mono>FeatureGrid/feature-card</Mono>); the site has no form-input primitives.
      </p>
    </DocSection>
  );
};
