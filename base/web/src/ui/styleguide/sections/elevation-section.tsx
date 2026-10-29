import { DocSection, Mono } from "../primitives";
import { SHADOW_META } from "../token-metadata";

export const ElevationSection = () => (
  <DocSection
    id="elevation"
    number="/4"
    title="Elevation & Depth"
    intro="Depth comes from Tailwind's default shadow scale. Cards pair a 1px border with shadow-sm."
  >
    <div className="rounded-lg bg-muted/50 p-8">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        {SHADOW_META.map((entry) => (
          <div key={entry.name}>
            <div
              className={`h-24 rounded-lg border border-border bg-background ${entry.name}`}
            />
            <Mono className="mt-4 block">{entry.name}</Mono>
            <span className="mt-1 block text-12 text-muted-foreground">
              {entry.usage}
            </span>
          </div>
        ))}
      </div>
    </div>

    <p className="mt-6 max-w-2xl text-12 text-muted-foreground">
      Card recipe: <Mono>rounded-lg border border-border bg-card shadow-sm</Mono>, plus{" "}
      <Mono>hover:shadow-md</Mono> when the whole card is a link (see{" "}
      <Mono>FeatureGrid/feature-card</Mono>).
    </p>
  </DocSection>
);
