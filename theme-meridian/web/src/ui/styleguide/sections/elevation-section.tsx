import { DocSection, Mono } from "../primitives";
import { SHADOW_META } from "../token-metadata";
import { DesignTokensModel, tokensByNames } from "../use-design-tokens";

export const ElevationSection = ({ tokens }: { tokens: DesignTokensModel }) => {
  const shadows = tokensByNames(
    tokens,
    SHADOW_META.map((entry) => entry.name),
  );

  return (
    <DocSection
      id="elevation"
      number="/4"
      title="Elevation & Depth"
      intro="Depth comes from a small set of shadow tokens. The card frame is a double 1px stroke, not a drop shadow."
    >
      <div className="rounded-2xl bg-muted/50 p-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {shadows.map((token) => {
            const meta = SHADOW_META.find((entry) => entry.name === token.short);
            return (
              <div key={token.name}>
                <div
                  className="h-24 rounded-xl bg-background"
                  style={{ boxShadow: token.value }}
                />
                <Mono className="mt-4 block">{token.short}</Mono>
                {meta && (
                  <span className="mt-1 block text-12 text-muted-foreground">
                    {meta.usage}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-6 max-w-2xl text-12 text-muted-foreground">
        <Mono>shadow-card</Mono> pairs with <Mono>border-4 border-background</Mono> to
        produce the signature outer-line / gap / inner-line card frame (see{" "}
        <Mono>FeatureGrid/feature-card</Mono>).
      </p>
    </DocSection>
  );
};
