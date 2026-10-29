import {
  bulletList,
  joinBlocks,
  labelLine,
  paragraph,
  presenceHint,
} from "@/lib/markdown/blocks";
import { markdownText } from "@/lib/markdown/escape";
import { ctaLink } from "@/lib/markdown/links";
import { portableTextToMarkdown } from "@/lib/markdown/portable-text";
import {
  pretitleLine,
  type SectionData,
  type SectionMarkdownSerializer,
} from "@/lib/markdown/sections";

import {
  calculateImpact,
  DEAL_SIZE,
  formatCycleChange,
  formatCycleWeeks,
  formatExtraDeals,
  formatMoney,
  formatPayback,
  formatReduction,
  formatTeamSize,
  INITIAL_CYCLE_WEEKS,
  TEAM_SIZE,
} from "./model";

const labelled = (label: unknown, value: string) => {
  const text = markdownText(label);

  return text ? `${text}: ${value}` : value;
};

export const impactCalculatorToMarkdown: SectionMarkdownSerializer<
  SectionData<"impact-calculator">
> = (section, context) => {
  const inputs = {
    teamSize: TEAM_SIZE.initial,
    dealSize: DEAL_SIZE.initial,
    cycleWeeks: INITIAL_CYCLE_WEEKS,
  };
  const result = calculateImpact(inputs);

  return joinBlocks([
    pretitleLine(section.pretitle),
    portableTextToMarkdown(section.content, context),
    presenceHint("Interactive calculator. Example with its default inputs below"),
    labelLine(section.inputsTitle),
    bulletList([
      labelled(section.teamSizeLabel, formatTeamSize(inputs.teamSize)),
      labelled(section.dealSizeLabel, formatMoney(inputs.dealSize)),
      labelled(section.cycleLengthLabel, formatCycleWeeks(inputs.cycleWeeks)),
    ]),
    labelLine(section.resultsTitle),
    bulletList([
      labelled(
        section.cycleReductionLabel,
        `${formatReduction(result)} (${formatCycleChange(inputs.cycleWeeks, result)})`,
      ),
      labelled(
        section.pipelineLabel,
        `${formatMoney(result.pipelineRecovered)} (${formatExtraDeals(result)})`,
      ),
      labelled(section.paybackLabel, formatPayback(result)),
    ]),
    ctaLink(section.cta, context),
    paragraph(section.note),
  ]);
};
