import { ImageFragment, LinkFragment } from "@/types/fragments";
import { ExtractSectionProps } from "@/types/sections";

export type FeatureGridProps = ExtractSectionProps<"feature-grid">;

export type FeatureGridItem = NonNullable<FeatureGridProps["cards"]>[number];

export interface CaseStudyCardData {
  _id: string;
  title?: string | null;
  eyebrow?: string | null;
  category?: string | null;
  publishedAt?: string | null;
  slug?: string | null;
  image?: ImageFragment | null;
  link?: LinkFragment | null;
}

export interface FeatureCardData {
  label?: string | null;
  title?: string | null;
  image?: ImageFragment | null;
  link?: LinkFragment | string | null;
}
