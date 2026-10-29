import { heading, joinBlocks, paragraph, textList } from "@/lib/markdown/blocks";
import { markdownText } from "@/lib/markdown/escape";
import { ctaLink } from "@/lib/markdown/links";
import { portableTextToMarkdown } from "@/lib/markdown/portable-text";
import {
  pretitleLine,
  type SectionData,
  type SectionMarkdownSerializer,
} from "@/lib/markdown/sections";
import type { MarkdownContext } from "@/lib/markdown/types";

type PricingSection = SectionData<"pricing">;
type Plan = NonNullable<NonNullable<PricingSection["plans"]>[number]>;

/** Same fallbacks as the toggle in `client.tsx`. */
const DEFAULT_MONTHLY_LABEL = "Monthly";
const DEFAULT_YEARLY_LABEL = "Yearly";

const priceText = (price: unknown, suffix: string) =>
  [markdownText(price), suffix].filter(Boolean).join(" ");

const priceLine = (plan: Plan, section: PricingSection): string => {
  const suffix = markdownText(plan.priceSuffix);
  const monthly = priceText(plan.monthlyPrice, suffix);
  const yearly = markdownText(plan.yearlyPrice)
    ? priceText(plan.yearlyPrice, suffix)
    : "";
  if (!yearly) return monthly;

  const monthlyLabel = markdownText(section.monthlyLabel) || DEFAULT_MONTHLY_LABEL;
  const yearlyLabel = markdownText(section.yearlyLabel) || DEFAULT_YEARLY_LABEL;

  return [monthly && `${monthlyLabel}: ${monthly}`, `${yearlyLabel}: ${yearly}`]
    .filter(Boolean)
    .join(" · ");
};

const planToMarkdown = (
  plan: Plan,
  section: PricingSection,
  context: MarkdownContext,
) => {
  const name = markdownText(plan.name);
  const badge = markdownText(plan.badge);
  const featuresTitle = markdownText(plan.featuresTitle);

  return joinBlocks([
    heading(3, [name, badge && `(${badge})`].filter(Boolean).join(" ")),
    paragraph(plan.description),
    priceLine(plan, section),
    featuresTitle && `**${featuresTitle}**`,
    textList(plan.features),
    ctaLink(plan.cta, context),
  ]);
};

export const pricingToMarkdown: SectionMarkdownSerializer<PricingSection> = (
  section,
  context,
) =>
  joinBlocks([
    pretitleLine(section.pretitle),
    portableTextToMarkdown(section.content, context),
    ...(section.plans ?? []).map((plan) =>
      plan ? planToMarkdown(plan, section, context) : "",
    ),
    paragraph(section.footnote),
  ]);
