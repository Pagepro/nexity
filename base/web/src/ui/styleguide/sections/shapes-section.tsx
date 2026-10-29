"use client";

import { DocSection, GroupLabel, Mono, TokenSkeleton } from "../primitives";
import { RADIUS_PATTERN } from "../token-metadata";
import { DesignTokensModel, tokensByPattern } from "../use-design-tokens";

export const ShapesSection = ({ tokens }: { tokens: DesignTokensModel }) => {
  const radii = tokensByPattern(tokens, RADIUS_PATTERN).sort(
    (a, b) => (a.px ?? 0) - (b.px ?? 0),
  );

  return (
    <DocSection
      id="shapes"
      number="/5"
      title="Shapes"
      intro="The radius scale plus the shape language: rounded-md controls, square bordered cards and images."
    >
      <GroupLabel>Radius scale</GroupLabel>
      {tokens.ready ? (
        <div className="flex flex-wrap gap-5">
          {radii.map((token) => (
            <div key={token.name} className="text-center">
              <div
                className="h-16 w-16 border border-border bg-card"
                style={{ borderRadius: token.value }}
              />
              <Mono className="mt-2 block">{token.short.replace("radius-", "")}</Mono>
              <span className="font-mono text-10 text-muted-foreground">
                {token.px ? `${token.px}px` : token.value}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <TokenSkeleton />
      )}

      <GroupLabel>Shape language</GroupLabel>
      <ul className="max-w-2xl list-disc space-y-2 pl-5 text-14 text-muted-foreground">
        <li>
          <strong className="text-foreground">Buttons</strong> — every button is{" "}
          <Mono>rounded-md</Mono>; size sets height, never radius.
        </li>
        <li>
          <strong className="text-foreground">Cards and images</strong> —{" "}
          <Mono>rounded-lg border border-border shadow-sm</Mono>; every step but{" "}
          <Mono>md</Mono> is 0, so surfaces are square.
        </li>
        <li>
          <strong className="text-foreground">Badges and dots</strong> —{" "}
          <Mono>rounded-full</Mono>.
        </li>
      </ul>
    </DocSection>
  );
};
