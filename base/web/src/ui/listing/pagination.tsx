import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { getPageWindow } from "./listing-utils";

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (_page: number) => void;
}) => {
  if (totalPages <= 1) return null;

  const pages = getPageWindow(currentPage, totalPages);
  const isPrevDisabled = currentPage <= 1;
  const isNextDisabled = currentPage >= totalPages;

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        type="button"
        disabled={isPrevDisabled}
        onClick={() => onPageChange(currentPage - 1)}
        className={clsx(
          "flex h-8 items-center gap-1 rounded-md py-2 pr-4 pl-2.5 text-14 font-medium text-foreground transition-colors hover:bg-foreground/5",
          isPrevDisabled && "pointer-events-none opacity-50",
        )}
      >
        <ChevronLeft className="size-4" aria-hidden />
        Previous
      </button>

      {pages.map((page, index) =>
        page === -1 ? (
          <span
            key={`ellipsis-${index}`}
            className="flex size-8 items-center justify-center text-muted-foreground"
            aria-hidden
          >
            …
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            aria-current={page === currentPage ? "page" : undefined}
            className={clsx(
              "flex size-8 items-center justify-center rounded-md text-14 font-medium transition-colors",
              page === currentPage
                ? "border border-input bg-background text-foreground"
                : "text-foreground hover:bg-foreground/5",
            )}
          >
            {page}
          </button>
        ),
      )}

      <button
        type="button"
        disabled={isNextDisabled}
        onClick={() => onPageChange(currentPage + 1)}
        className={clsx(
          "flex h-8 items-center gap-1 rounded-md py-2 pr-2.5 pl-4 text-14 font-medium text-foreground transition-colors hover:bg-foreground/5",
          isNextDisabled && "pointer-events-none opacity-50",
        )}
      >
        Next
        <ChevronRight className="size-4" aria-hidden />
      </button>
    </div>
  );
};

export default Pagination;
