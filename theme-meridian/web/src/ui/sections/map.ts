import BentoGrid from "./BentoGrid";
import BlogListingSection from "./BlogListingSection";
import CaseStudiesListingSection from "./CaseStudiesListingSection";
import ComparisonTable from "./ComparisonTable";
import ContactForm from "./ContactForm";
import ContentSection from "./ContentSection";
import CtaBanner from "./CtaBanner";
import FaqSection from "./FaqSection";
import FeatureBlockSection from "./FeatureBlockSection";
import FeatureGrid from "./FeatureGrid";
import HeroSection from "./HeroSection";
import ImpactCalculator from "./ImpactCalculator";
import IntegrationsGrid from "./IntegrationsGrid";
import LogosCarousel from "./LogosCarousel";
import NewsletterSection from "./NewsletterSection";
import PodcastListingSection from "./PodcastListingSection";
import Pricing from "./Pricing";
import SplitSections from "./SplitSections";
import Stats from "./Stats";
import TestimonialsSection from "./TestimonialsSection";
import TextBlockSection from "./TextBlockSection";
import TrustBadges from "./TrustBadges";

// Every section type except `shared-section-ref`: SharedSection renders its
// nested sections with this map too.
export const INNER_SECTION_MAP = {
  "bento-grid": BentoGrid,
  "blog-listing": BlogListingSection,
  "podcast-listing": PodcastListingSection,
  "case-studies-listing": CaseStudiesListingSection,
  "comparison-table": ComparisonTable,
  "contact-form": ContactForm,
  content: ContentSection,
  "cta-banner": CtaBanner,
  faq: FaqSection,
  "feature-block": FeatureBlockSection,
  "feature-grid": FeatureGrid,
  hero: HeroSection,
  "impact-calculator": ImpactCalculator,
  "integrations-grid": IntegrationsGrid,
  "logos-carousel": LogosCarousel,
  newsletter: NewsletterSection,
  pricing: Pricing,
  "split-sections": SplitSections,
  stats: Stats,
  testimonials: TestimonialsSection,
  "text-block": TextBlockSection,
  "trust-badges": TrustBadges,
} as const;

export type InnerSectionKey = keyof typeof INNER_SECTION_MAP;
