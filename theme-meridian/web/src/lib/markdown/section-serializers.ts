import { flattenSharedSections } from "@/lib/schema-org/build-graph";
import { bentoGridToMarkdown } from "@/ui/sections/BentoGrid/markdown";
import { blogListingToMarkdown } from "@/ui/sections/BlogListingSection/markdown";
import { caseStudiesListingToMarkdown } from "@/ui/sections/CaseStudiesListingSection/markdown";
import { comparisonTableToMarkdown } from "@/ui/sections/ComparisonTable/markdown";
import { contactFormToMarkdown } from "@/ui/sections/ContactForm/markdown";
import { contentToMarkdown } from "@/ui/sections/ContentSection/markdown";
import { ctaBannerToMarkdown } from "@/ui/sections/CtaBanner/markdown";
import { faqToMarkdown } from "@/ui/sections/FaqSection/markdown";
import { featureBlockToMarkdown } from "@/ui/sections/FeatureBlockSection/markdown";
import { featureGridToMarkdown } from "@/ui/sections/FeatureGrid/markdown";
import { heroToMarkdown } from "@/ui/sections/HeroSection/markdown";
import { impactCalculatorToMarkdown } from "@/ui/sections/ImpactCalculator/markdown";
import { integrationsGridToMarkdown } from "@/ui/sections/IntegrationsGrid/markdown";
import { logosCarouselToMarkdown } from "@/ui/sections/LogosCarousel/markdown";
import { newsletterToMarkdown } from "@/ui/sections/NewsletterSection/markdown";
import { podcastListingToMarkdown } from "@/ui/sections/PodcastListingSection/markdown";
import { pricingToMarkdown } from "@/ui/sections/Pricing/markdown";
import { splitSectionsToMarkdown } from "@/ui/sections/SplitSections/markdown";
import { statsToMarkdown } from "@/ui/sections/Stats/markdown";
import { testimonialsToMarkdown } from "@/ui/sections/TestimonialsSection/markdown";
import { textBlockToMarkdown } from "@/ui/sections/TextBlockSection/markdown";
import { trustBadgesToMarkdown } from "@/ui/sections/TrustBadges/markdown";

import { joinBlocks } from "./blocks";
import { cleanText } from "./escape";
import type { SectionData, SectionMarkdownSerializer, SectionType } from "./sections";
import type { MarkdownContext } from "./types";

// A serializer mirrors what the component shows (docs/guides/markdown-for-agents.md).
// A section type with no entry fails `pnpm typecheck`; `null` is an explicit "nothing".
export const SECTION_MARKDOWN_SERIALIZERS = {
  "bento-grid": bentoGridToMarkdown,
  "blog-listing": blogListingToMarkdown,
  "case-studies-listing": caseStudiesListingToMarkdown,
  "comparison-table": comparisonTableToMarkdown,
  "contact-form": contactFormToMarkdown,
  content: contentToMarkdown,
  "cta-banner": ctaBannerToMarkdown,
  faq: faqToMarkdown,
  "feature-block": featureBlockToMarkdown,
  "feature-grid": featureGridToMarkdown,
  hero: heroToMarkdown,
  "impact-calculator": impactCalculatorToMarkdown,
  "integrations-grid": integrationsGridToMarkdown,
  "logos-carousel": logosCarouselToMarkdown,
  newsletter: newsletterToMarkdown,
  "podcast-listing": podcastListingToMarkdown,
  pricing: pricingToMarkdown,
  "split-sections": splitSectionsToMarkdown,
  stats: statsToMarkdown,
  testimonials: testimonialsToMarkdown,
  "text-block": textBlockToMarkdown,
  "trust-badges": trustBadgesToMarkdown,
  "shared-section-ref": null, // flattened into its inner sections before this registry runs
} satisfies {
  [TType in SectionType]: SectionMarkdownSerializer<SectionData<TType>> | null;
};

type _MissingSerializers = Exclude<
  SectionType,
  keyof typeof SECTION_MARKDOWN_SERIALIZERS
>;
const _AssertSerializersComplete: _MissingSerializers extends never
  ? true
  : [
      "Declare a Markdown serializer (or null) in SECTION_MARKDOWN_SERIALIZERS for:",
      _MissingSerializers,
    ] = true;
void _AssertSerializersComplete;

interface MarkdownSectionInput {
  _type?: string | null;
  options?: { hidden?: boolean | null } | null;
  [field: string]: unknown;
}

const serializerFor = (type: string) =>
  (
    SECTION_MARKDOWN_SERIALIZERS as unknown as Record<
      string,
      SectionMarkdownSerializer<MarkdownSectionInput> | null | undefined
    >
  )[type] ?? null;

export const sectionsToMarkdown = (
  sections: readonly (MarkdownSectionInput | null | undefined)[] | null | undefined,
  context: MarkdownContext,
): string =>
  joinBlocks(
    flattenSharedSections(sections as Parameters<typeof flattenSharedSections>[0]).map(
      (section) => {
        const input = section as MarkdownSectionInput;
        if (input.options?.hidden) return "";

        const type = cleanText(input._type);
        const serializer = type ? serializerFor(type) : null;
        if (!serializer) return "";

        try {
          return serializer(input, context);
        } catch (error) {
          console.error(`[markdown] the "${type}" serializer failed`, error);

          return "";
        }
      },
    ),
  );
