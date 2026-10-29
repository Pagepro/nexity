"use client";

import { useMemo, useState } from "react";

import CategoryTabs from "@/ui/listing/category-tabs";
import SearchInput from "@/ui/listing/search-input";

import { IntegrationTile } from "./integration-tile";
import { Integration } from "./types";
import { ALL_SLUG, buildCategories, filterIntegrations } from "./utils";

interface IntegrationsGridClientProps {
  integrations: Integration[];
  allLabel: string;
  searchPlaceholder: string;
  emptyMessage: string;
}

export const IntegrationsGridClient = ({
  integrations,
  allLabel,
  searchPlaceholder,
  emptyMessage,
}: IntegrationsGridClientProps) => {
  const [activeSlug, setActiveSlug] = useState(ALL_SLUG);
  const [query, setQuery] = useState("");

  const categories = useMemo(
    () => buildCategories(integrations, allLabel),
    [integrations, allLabel],
  );
  const visible = useMemo(
    () => filterIntegrations(integrations, activeSlug, query),
    [integrations, activeSlug, query],
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <CategoryTabs
          categories={categories}
          activeSlug={activeSlug}
          onCategoryChange={setActiveSlug}
        />
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder={searchPlaceholder}
          label={searchPlaceholder}
        />
      </div>

      {visible.length ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((integration) => (
            <li key={integration._id}>
              <IntegrationTile integration={integration} />
            </li>
          ))}
        </ul>
      ) : (
        <output className="block py-12 text-center text-14 text-muted-foreground">
          {emptyMessage}
        </output>
      )}
    </div>
  );
};
