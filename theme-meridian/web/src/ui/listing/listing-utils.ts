/** `value: ""` is the "all" pseudo-category that disables the GROQ filter. */
export interface ListingCategory {
  slug: string;
  label: string;
  value: string;
}

const MONTH_FORMATTER = new Intl.DateTimeFormat("en-US", { month: "long" });

export function formatListingMeta(
  category: string | null | undefined,
  publishedAt: string | null | undefined,
): string {
  const parts: string[] = [];

  if (category) parts.push(category);
  if (publishedAt) {
    const date = new Date(publishedAt);

    parts.push(
      `${date.getDate()} ${MONTH_FORMATTER.format(date)}, ${date.getFullYear()}`,
    );
  }

  return parts.join(" · ");
}

export function getCategoryBySlug(
  categories: readonly ListingCategory[],
  slug: string | null,
): ListingCategory {
  if (!slug) return categories[0];
  const found = categories.find((category) => category.slug === slug);

  return found || categories[0];
}

export function clampPage(page: number, totalPages: number): number {
  if (isNaN(page) || page < 1) return 1;
  if (totalPages < 1) return 1;

  return Math.min(page, totalPages);
}

export function buildListingUrl(
  categorySlug: string,
  query: string,
  page: number,
): string {
  const params = new URLSearchParams();

  if (categorySlug !== "all") params.set("category", categorySlug);
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));

  const queryString = params.toString();

  return queryString ? `?${queryString}` : window.location.pathname;
}

export function buildListingApiUrl(
  apiPath: string,
  categoryValue: string,
  query: string,
  page: number,
  perPage: number,
): string {
  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("perPage", String(perPage));
  if (categoryValue) params.set("category", categoryValue);
  if (query) params.set("q", query);

  return `${apiPath}?${params.toString()}`;
}

/** `-1` is the ellipsis sentinel: e.g. `1 … 4 5 6 … 12`. */
export function getPageWindow(currentPage: number, totalPages: number): number[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, currentPage]);

  if (currentPage - 1 > 1) pages.add(currentPage - 1);
  if (currentPage + 1 < totalPages) pages.add(currentPage + 1);

  const sorted = Array.from(pages).sort((first, second) => first - second);
  const withEllipsis: number[] = [];

  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) withEllipsis.push(-1);
    withEllipsis.push(page);
  });

  return withEllipsis;
}
