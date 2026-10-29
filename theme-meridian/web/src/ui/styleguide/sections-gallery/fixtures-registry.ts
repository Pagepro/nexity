/**
 * React-free and serializable so scripts / MCP tools / the `sections.json` route can
 * read the fixtures. NEVER import `SECTION_MAP` or components here (they pull React
 * and the whole UI tree).
 */
import type { ExtractSectionProps, PageSection } from "@/types/sections";
import { bentoGridFixture } from "@/ui/sections/BentoGrid/gallery-fixture";
import { blogListingFixture } from "@/ui/sections/BlogListingSection/gallery-fixture";
import { caseStudiesListingFixture } from "@/ui/sections/CaseStudiesListingSection/gallery-fixture";
import { comparisonTableFixture } from "@/ui/sections/ComparisonTable/gallery-fixture";
import { contactFormFixture } from "@/ui/sections/ContactForm/gallery-fixture";
import { contentFixture } from "@/ui/sections/ContentSection/gallery-fixture";
import { ctaBannerFixture } from "@/ui/sections/CtaBanner/gallery-fixture";
import { faqFixture } from "@/ui/sections/FaqSection/gallery-fixture";
import { featureBlockFixture } from "@/ui/sections/FeatureBlockSection/gallery-fixture";
import { featureGridFixture } from "@/ui/sections/FeatureGrid/gallery-fixture";
import { heroFixture } from "@/ui/sections/HeroSection/gallery-fixture";
import { impactCalculatorFixture } from "@/ui/sections/ImpactCalculator/gallery-fixture";
import { integrationsGridFixture } from "@/ui/sections/IntegrationsGrid/gallery-fixture";
import { logosCarouselFixture } from "@/ui/sections/LogosCarousel/gallery-fixture";
import { newsletterFixture } from "@/ui/sections/NewsletterSection/gallery-fixture";
import { podcastListingFixture } from "@/ui/sections/PodcastListingSection/gallery-fixture";
import { pricingFixture } from "@/ui/sections/Pricing/gallery-fixture";
import { sharedSectionRefFixture } from "@/ui/sections/SharedSection/gallery-fixture";
import { splitSectionsFixture } from "@/ui/sections/SplitSections/gallery-fixture";
import { statsFixture } from "@/ui/sections/Stats/gallery-fixture";
import { testimonialsFixture } from "@/ui/sections/TestimonialsSection/gallery-fixture";
import { textBlockFixture } from "@/ui/sections/TextBlockSection/gallery-fixture";
import { trustBadgesFixture } from "@/ui/sections/TrustBadges/gallery-fixture";

export type SectionType = PageSection["_type"];

export const SECTION_TYPES = [
  "hero",
  "content",
  "feature-block",
  "feature-grid",
  "bento-grid",
  "split-sections",
  "stats",
  "text-block",
  "faq",
  "testimonials",
  "trust-badges",
  "logos-carousel",
  "integrations-grid",
  "impact-calculator",
  "contact-form",
  "cta-banner",
  "newsletter",
  "pricing",
  "comparison-table",
  "blog-listing",
  "case-studies-listing",
  "podcast-listing",
  "shared-section-ref",
] as const satisfies readonly SectionType[];

// Drift guard: every generated section type must appear in SECTION_TYPES.
type _MissingFromGallery = Exclude<SectionType, (typeof SECTION_TYPES)[number]>;
const _AssertComplete: _MissingFromGallery extends never
  ? true
  : ["Add these section types to the gallery SECTION_TYPES:", _MissingFromGallery] = true;
void _AssertComplete;

export type SectionFixtures = { [K in SectionType]?: ExtractSectionProps<K> };

export const SECTION_FIXTURES: SectionFixtures = {
  hero: heroFixture,
  content: contentFixture,
  "feature-block": featureBlockFixture,
  "feature-grid": featureGridFixture,
  "bento-grid": bentoGridFixture,
  "trust-badges": trustBadgesFixture,
  "integrations-grid": integrationsGridFixture,
  "impact-calculator": impactCalculatorFixture,
  "contact-form": contactFormFixture,
  "split-sections": splitSectionsFixture,
  stats: statsFixture,
  "text-block": textBlockFixture,
  faq: faqFixture,
  testimonials: testimonialsFixture,
  "logos-carousel": logosCarouselFixture,
  "cta-banner": ctaBannerFixture,
  newsletter: newsletterFixture,
  pricing: pricingFixture,
  "comparison-table": comparisonTableFixture,
  "blog-listing": blogListingFixture,
  "podcast-listing": podcastListingFixture,
  "case-studies-listing": caseStudiesListingFixture,
  "shared-section-ref": sharedSectionRefFixture,
};

export const hasFixture = (type: SectionType): boolean => Boolean(SECTION_FIXTURES[type]);
