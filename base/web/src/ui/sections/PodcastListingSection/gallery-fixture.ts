// Episodes are fetched at runtime, so this fixture only satisfies the type.
import type { ExtractSectionProps } from "@/types/sections";

export const podcastListingFixture = {
  _type: "podcast-listing",
  _key: "gallery-fixture-podcast-listing",
  perPage: 8,
} satisfies ExtractSectionProps<"podcast-listing">;
