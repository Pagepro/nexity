import { hasLinkTarget } from "@/ui/components/Link/BaseLink/utils";
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
    link: hasLinkTarget(link) ? link : slug ? `/case-studies/${slug}` : null,
  };
};

export const toFeatureCard = (item: FeatureGridItem): FeatureCardData | null => {
  if (item._type === "card") {
    return {
      label: item.eyebrow,
      title: item.title,
      image: item.image,
      link: hasLinkTarget(item.link) ? item.link : null,
    };
  }

  if (item._type === "case-study") {
    return caseStudyToCard(item);
  }

  return null;
};
