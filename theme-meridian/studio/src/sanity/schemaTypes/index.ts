import { type SchemaTypeDefinition } from "sanity";

import typeSource from "./documents/__type-source";
import author from "./documents/author";
import blogListingPage from "./documents/blog-listing-page";
import caseStudiesListingPage from "./documents/case-studies-listing-page";
import caseStudy from "./documents/case-study";
import footer from "./documents/footer";
import globalSection from "./documents/global-section";
import header from "./documents/header";
import integration from "./documents/integration";
import page from "./documents/page";
import podcastEpisode from "./documents/podcast-episode";
import podcastListingPage from "./documents/podcast-listing-page";
import post from "./documents/post";
import redirect from "./documents/redirect";
import rewrite from "./documents/rewrite";
import sharedSection from "./documents/shared-section";
import site from "./documents/site";
import testimonial from "./documents/testimonial";
import buttonIcon from "./objects/buttonIcon";
import cta from "./objects/cta";
import headerCta from "./objects/headerCta";
import headerLink from "./objects/headerLink";
import headerLinkList from "./objects/headerLink.list";
import icon from "./objects/icon";
import img from "./objects/img";
import link from "./objects/link";
import linkList from "./objects/link.list";
import metadata from "./objects/metadata";
import platformLink from "./objects/platformLink";
import richText from "./objects/richText";
import callout from "./objects/richText/blocks/callout";
import checklist from "./objects/richText/blocks/checklist";
import pullquote from "./objects/richText/blocks/pullquote";
import videoEmbed from "./objects/richText/blocks/video-embed";
import pageRichText from "./objects/richText/pageRichText";
import simpleRichText from "./objects/richText/simpleRichText";
import sectionOptions from "./objects/section-options";
import simpleLink from "./objects/simpleLink";
import bentoGrid from "./sections/bento-grid";
import blogListing from "./sections/blog-listing";
import caseStudiesListing from "./sections/case-studies-listing";
import comparisonTable from "./sections/comparison-table";
import contactForm from "./sections/contact-form";
import content from "./sections/content";
import ctaBanner from "./sections/cta-banner";
import faq from "./sections/faq";
import featureBlock from "./sections/feature-block";
import featureGrid from "./sections/feature-grid";
import hero from "./sections/hero";
import impactCalculator from "./sections/impact-calculator";
import integrationsGrid from "./sections/integrations-grid";
import logosCarousel from "./sections/logos-carousel";
import newsletter from "./sections/newsletter";
import podcastListing from "./sections/podcast-listing";
import pricing from "./sections/pricing";
import sharedSectionRef from "./sections/shared-section-ref";
import splitSections from "./sections/split-sections";
import stats from "./sections/stats";
import testimonials from "./sections/testimonials";
import textBlock from "./sections/text-block";
import trustBadges from "./sections/trust-badges";

export const schemaTypes: SchemaTypeDefinition[] = [
  post,
  blogListingPage,
  caseStudiesListingPage,
  podcastEpisode,
  podcastListingPage,
  site,
  header,
  footer,
  page,
  globalSection,
  sharedSection,
  redirect,
  rewrite,
  testimonial,
  integration,
  caseStudy,
  author,
  typeSource,

  cta,
  img,
  link,
  linkList,
  metadata,
  platformLink,
  sectionOptions,
  simpleLink,
  richText,
  simpleRichText,
  pageRichText,
  pullquote,
  callout,
  videoEmbed,
  checklist,
  headerLink,
  headerLinkList,
  headerCta,
  icon,
  buttonIcon,

  bentoGrid,
  blogListing,
  caseStudiesListing,
  comparisonTable,
  contactForm,
  content,
  ctaBanner,
  faq,
  featureBlock,
  featureGrid,
  hero,
  impactCalculator,
  integrationsGrid,
  logosCarousel,
  newsletter,
  podcastListing,
  pricing,
  sharedSectionRef,
  splitSections,
  stats,
  testimonials,
  textBlock,
  trustBadges,
];
