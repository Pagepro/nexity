"use client";

import { DocSection, GroupLabel, Mono, TokenRow, TokenSkeleton } from "../primitives";
import { BREAKPOINTS, LAYOUT_META } from "../token-metadata";
import { DesignTokensModel } from "../use-design-tokens";

const SPACING_STEPS = [1, 2, 3, 4, 6, 8, 10, 12, 16, 20, 24];

export const LayoutSpacingSection = ({ tokens }: { tokens: DesignTokensModel }) => {
  const layoutTokens = tokens.all.filter(
    (token) => token.short in LAYOUT_META && !token.isAlias,
  );

  return (
    <DocSection
      id="layout"
      number="/3"
      title="Layout & Spacing"
      intro="Container, section rhythm, named heights, motion, and responsive breakpoints."
    >
      <GroupLabel>Spacing scale</GroupLabel>
      <p className="mb-5 max-w-2xl text-12 text-muted-foreground">
        Spacing uses Tailwind v4&rsquo;s single base unit <Mono>--spacing</Mono> ={" "}
        <strong className="text-foreground">4px</strong>; every <Mono>p-*</Mono> /{" "}
        <Mono>gap-*</Mono> / <Mono>m-*</Mono> utility is a multiple of it (there are no
        named <Mono>xs/sm/md</Mono> spacing tokens). Common steps:
      </p>
      <div className="mb-2 flex flex-wrap items-end gap-x-6 gap-y-4">
        {SPACING_STEPS.map((step) => (
          <div key={step} className="flex flex-col gap-2">
            <div
              className="h-7 rounded-sm bg-foreground"
              style={{ width: `${step * 4}px` }}
            />
            <span className="font-mono text-10 text-muted-foreground">
              {step} · {step * 4}px
            </span>
          </div>
        ))}
      </div>

      <GroupLabel>Spacing &amp; layout tokens</GroupLabel>
      {tokens.ready ? (
        layoutTokens.map((token) => (
          <TokenRow
            key={token.name}
            meta={
              <>
                <div className="font-medium text-foreground">{token.short}</div>
                <div className="mt-1">
                  {token.value}
                  {token.px ? ` · ${token.px}px` : ""}
                </div>
              </>
            }
          >
            <div className="text-12 text-muted-foreground">
              {LAYOUT_META[token.short]}
            </div>
          </TokenRow>
        ))
      ) : (
        <TokenSkeleton />
      )}

      <GroupLabel>Responsive breakpoints</GroupLabel>
      <table className="w-full max-w-2xl text-14">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="py-2 font-medium">Name</th>
            <th className="py-2 font-medium">Min width</th>
            <th className="py-2 font-medium">Behaviour</th>
          </tr>
        </thead>
        <tbody>
          {BREAKPOINTS.map((breakpoint) => (
            <tr key={breakpoint.name} className="border-b border-border">
              <td className="py-2">
                <Mono>{breakpoint.name}</Mono>
              </td>
              <td className="py-2 font-mono text-12 text-muted-foreground">
                {breakpoint.min}
              </td>
              <td className="py-2 text-muted-foreground">{breakpoint.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </DocSection>
  );
};
