import { stegaClean } from "next-sanity";

import { INTEGRATION_CATEGORIES } from "@/consts/integration-categories";
import { type ListingCategory } from "@/ui/listing/listing-utils";

import { Integration } from "./types";

export const ALL_SLUG = "all";

export const buildCategories = (
  integrations: Integration[],
  allLabel: string,
): ListingCategory[] => {
  const used = new Set(integrations.map((item) => stegaClean(item.category)));

  return [
    { slug: ALL_SLUG, label: allLabel, value: "" },
    ...INTEGRATION_CATEGORIES.filter((category) => used.has(category.value)).map(
      (category) => ({
        slug: category.value,
        label: category.title,
        value: category.value,
      }),
    ),
  ];
};

export const categoryLabel = (category: string | null) =>
  INTEGRATION_CATEGORIES.find((item) => item.value === stegaClean(category))?.title ?? "";

export const filterIntegrations = (
  integrations: Integration[],
  activeSlug: string,
  query: string,
) => {
  const needle = query.trim().toLowerCase();

  return integrations.filter((item) => {
    const matchesCategory =
      activeSlug === ALL_SLUG || stegaClean(item.category) === activeSlug;
    const matchesQuery =
      !needle ||
      stegaClean(item.name).toLowerCase().includes(needle) ||
      categoryLabel(item.category).toLowerCase().includes(needle);

    return matchesCategory && matchesQuery;
  });
};
