"use client";

import { BODY_STYLES, HEADING_STYLES } from "@/ui/RichText/block-styles";

import { DocSection, GroupLabel, Mono, TokenRow, TokenSkeleton } from "../primitives";
import { BODY_SAMPLES, HEADING_SAMPLES } from "../sample-copy";
import { TEXT_LADDER_PATTERN } from "../token-metadata";
import { DesignTokensModel, tokensByPattern } from "../use-design-tokens";

export const TypographySection = ({ tokens }: { tokens: DesignTokensModel }) => {
  const sizeTokens = tokensByPattern(tokens, TEXT_LADDER_PATTERN).sort(
    (a, b) => (a.px ?? 0) - (b.px ?? 0),
  );

  return (
    <DocSection
      id="typography"
      number="/2"
      title="Typography"
      intro="Mona Sans SemiExpanded. The size ladder and the CMS block styles, each shown in real use."
    >
      <GroupLabel>Block styles · headings</GroupLabel>
      {Object.entries(HEADING_STYLES).map(([key, utility]) => (
        <TokenRow
          key={key}
          meta={
            <>
              <div className="font-medium text-foreground">{key}</div>
              <div className="mt-1">
                <Mono>{utility}</Mono>
              </div>
            </>
          }
        >
          <div className={utility}>{HEADING_SAMPLES[key] ?? "The quick brown fox"}</div>
        </TokenRow>
      ))}

      <GroupLabel>Block styles · body</GroupLabel>
      {Object.entries(BODY_STYLES).map(([key, utility]) => (
        <TokenRow
          key={key}
          meta={
            <>
              <div className="font-medium text-foreground">{key}</div>
              <div className="mt-1">
                <Mono>{utility}</Mono>
              </div>
            </>
          }
        >
          <div className={`${utility} text-muted-foreground`}>
            {BODY_SAMPLES[key] ?? "The quick brown fox jumps over the lazy dog."}
          </div>
        </TokenRow>
      ))}

      <GroupLabel>Size ladder</GroupLabel>
      {tokens.ready ? (
        sizeTokens.map((token) => (
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
            <div
              className="truncate text-foreground"
              style={{ fontSize: token.value, lineHeight: 1.1 }}
            >
              Build something amazing
            </div>
          </TokenRow>
        ))
      ) : (
        <TokenSkeleton />
      )}

      <p className="mt-6 text-12 text-muted-foreground">
        <code className="font-mono">alt-*</code> block styles render at the same size as
        their numbered peer (single Mona Sans family).
      </p>
    </DocSection>
  );
};
