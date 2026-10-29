"use client";

import clsx from "clsx";
import { useSearchParams } from "next/navigation";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";

import CategoryTabs from "./category-tabs";
import {
  buildListingApiUrl,
  buildListingUrl,
  clampPage,
  getCategoryBySlug,
  type ListingCategory,
} from "./listing-utils";
import Pagination from "./pagination";
import SearchInput from "./search-input";

const SEARCH_DEBOUNCE_MS = 300;

interface ListingItem {
  _id: string;
}

interface ListingGridProps<TItem extends ListingItem> {
  initialItems: TItem[];
  initialTotal: number;
  perPage: number;
  categories: readonly ListingCategory[];
  apiPath: string;
  parseResponse: (_data: unknown) => { items: TItem[]; total: number };
  renderCard: (_item: TItem) => ReactNode;
  searchPlaceholder: string;
  searchLabel: string;
  emptyLabel: string;
  listClassName?: string;
}

const DEFAULT_LIST_CLASS = "mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3";

interface ListingState {
  categorySlug: string;
  query: string;
  page: number;
}

const readState = (
  params: URLSearchParams,
  categories: readonly ListingCategory[],
): ListingState => {
  const parsedPage = Number.parseInt(params.get("page") ?? "1", 10);

  return {
    categorySlug: getCategoryBySlug(categories, params.get("category")).slug,
    query: params.get("q") ?? "",
    page: Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1,
  };
};

const ListingGrid = <TItem extends ListingItem>({
  initialItems,
  initialTotal,
  perPage,
  categories,
  apiPath,
  parseResponse,
  renderCard,
  searchPlaceholder,
  searchLabel,
  emptyLabel,
  listClassName = DEFAULT_LIST_CLASS,
}: ListingGridProps<TItem>) => {
  const searchParams = useSearchParams();
  const sectionRef = useRef<HTMLDivElement>(null);

  const initial = readState(new URLSearchParams(searchParams.toString()), categories);

  const [categorySlug, setCategorySlug] = useState(initial.categorySlug);
  const [query, setQuery] = useState(initial.query);
  const [debouncedQuery, setDebouncedQuery] = useState(initial.query);
  const [page, setPage] = useState(initial.page);

  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);

  const requestIdRef = useRef(0);
  const isFirstFetchRun = useRef(true);
  const isFirstUrlRun = useRef(true);

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const clampedPage = clampPage(page, totalPages);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [query]);

  // Skip the first run when it matches the server-rendered defaults (`initialItems`).
  useEffect(() => {
    const isDefaultView =
      categorySlug === "all" && debouncedQuery.trim() === "" && clampedPage === 1;

    if (isFirstFetchRun.current) {
      isFirstFetchRun.current = false;
      if (isDefaultView) return;
    }

    const categoryValue = getCategoryBySlug(categories, categorySlug).value;
    const url = buildListingApiUrl(
      apiPath,
      categoryValue,
      debouncedQuery.trim(),
      clampedPage,
      perPage,
    );

    const requestId = ++requestIdRef.current;
    const controller = new AbortController();

    setLoading(true);

    fetch(url, { signal: controller.signal })
      .then((response) =>
        response.ok
          ? response.json()
          : Promise.reject(new Error(`Request failed: ${response.status}`)),
      )
      .then((data: unknown) => {
        if (requestId !== requestIdRef.current) return;

        const parsed = parseResponse(data);

        setItems(parsed.items);
        setTotal(parsed.total);
        setLoading(false);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || requestId !== requestIdRef.current) return;

        console.error(`Failed to load listing from ${apiPath}`, error);
        setLoading(false);
      });

    return () => controller.abort();
  }, [
    categorySlug,
    debouncedQuery,
    clampedPage,
    perPage,
    categories,
    apiPath,
    parseResponse,
  ]);

  useEffect(() => {
    if (isFirstUrlRun.current) {
      isFirstUrlRun.current = false;

      return;
    }

    window.history.pushState(
      null,
      "",
      buildListingUrl(categorySlug, debouncedQuery.trim(), clampedPage),
    );
  }, [categorySlug, debouncedQuery, clampedPage]);

  const handlePopState = useCallback(() => {
    const next = readState(new URLSearchParams(window.location.search), categories);

    setCategorySlug(next.categorySlug);
    setQuery(next.query);
    setDebouncedQuery(next.query);
    setPage(next.page);
  }, [categories]);

  useEffect(() => {
    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
  }, [handlePopState]);

  const handleCategoryChange = (slug: string) => {
    setCategorySlug(slug);
    setPage(1);
  };

  const handleSearch = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div ref={sectionRef} className="mt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CategoryTabs
          categories={categories}
          activeSlug={categorySlug}
          onCategoryChange={handleCategoryChange}
        />
        <SearchInput
          value={query}
          onChange={handleSearch}
          placeholder={searchPlaceholder}
          label={searchLabel}
        />
      </div>

      {items.length > 0 ? (
        <div
          className={clsx(listClassName, "transition-opacity", loading && "opacity-60")}
        >
          {items.map((item) => renderCard(item))}
        </div>
      ) : (
        <div className="mt-12 text-center text-14 text-muted-foreground">
          {emptyLabel}
        </div>
      )}

      <div className="mt-12">
        <Pagination
          currentPage={clampedPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default ListingGrid;
