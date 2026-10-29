import clsx from "clsx";

import { type ListingCategory } from "./listing-utils";

const CategoryTabs = ({
  categories,
  activeSlug,
  onCategoryChange,
}: {
  categories: readonly ListingCategory[];
  activeSlug: string;
  onCategoryChange: (_slug: string) => void;
}) => (
  // `text-12` stays on the wrapper: `cn` would drop it next to the buttons' `text-*` color.
  <div className="flex flex-wrap items-center gap-1.5 text-12">
    {categories.map((category) => {
      const isActive = activeSlug === category.slug;

      return (
        <button
          key={category.slug}
          type="button"
          onClick={() => onCategoryChange(category.slug)}
          aria-pressed={isActive}
          className={clsx(
            "rounded-md px-2 py-1 font-medium transition-colors",
            isActive
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/70",
          )}
        >
          {category.label}
        </button>
      );
    })}
  </div>
);

export default CategoryTabs;
