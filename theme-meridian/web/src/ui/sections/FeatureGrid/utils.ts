import { stegaClean } from "next-sanity";

import { formatListingMeta } from "@/ui/listing/listing-utils";

import { CaseStudyCardData, FeatureCardData, FeatureGridItem } from "./types";

export const caseStudyToCard = (caseStudy: CaseStudyCardData): FeatureCardData => {
  const { eyebrow, category, publishedAt, title, image, link, slug } = caseStudy;

  return {
    label:
      category || publishedAt
        ? formatListingMeta(category, publishedAt)
        : eyebrow || "Case study",
    title,
    image,
    link: stegaClean(link?.type) ? link : slug ? `/case-studies/${slug}` : null,
  };
};

export const toFeatureCard = (item: FeatureGridItem): FeatureCardData | null => {
  if (item._type === "card") {
    return {
      label: item.eyebrow,
      title: item.title,
      image: item.image,
      link: stegaClean(item.link?.type) ? item.link : null,
    };
  }

  if (item._type === "case-study") {
    return caseStudyToCard(item);
  }

  return null;
};
