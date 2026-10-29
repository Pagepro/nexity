import { DocSection, GroupLabel, Swatch } from "../primitives";
import { COLOR_GROUPS, COLOR_META } from "../token-metadata";
import { DesignTokensModel, tokensByNames } from "../use-design-tokens";

export const ColorsSection = ({ tokens }: { tokens: DesignTokensModel }) => {
  const colorTokens = tokensByNames(tokens, Object.keys(COLOR_META));

  const grouped = COLOR_GROUPS.map((group) => ({
    ...group,
    tokens: colorTokens
      .filter((token) => COLOR_META[token.short]?.group === group.id)
      .sort(
        (a, b) => (COLOR_META[a.short]?.order ?? 99) - (COLOR_META[b.short]?.order ?? 99),
      ),
  })).filter((group) => group.tokens.length > 0);

  return (
    <DocSection
      id="colors"
      number="/1"
      title="Colors"
      intro='Semantic colour tokens on the Tailwind "neutral" palette. Each value is the authored token, read from app.css; the right half of a swatch is its value in dark sections.'
    >
      {grouped.map((group) => (
        <div key={group.id}>
          <GroupLabel>{group.label}</GroupLabel>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {group.tokens.map((token) => (
              <Swatch
                key={token.name}
                color={token.value}
                name={token.short}
                value={token.value}
                darkValue={token.darkValue}
                usage={COLOR_META[token.short]?.usage}
                alias={COLOR_META[token.short]?.designMdAlias}
              />
            ))}
          </div>
        </div>
      ))}
    </DocSection>
  );
};
