import clsx from "clsx";
import { Check, Minus, X } from "lucide-react";

import { resolveCell } from "./constants";
import { Cell } from "./types";

interface CellValueProps {
  cell: Cell | undefined;
  featured?: boolean;
}

const ICON_GLYPH = "size-3 text-muted-foreground";
const CHECK_GLYPH = "size-3 text-foreground";

export const CellValue = ({ cell, featured = false }: CellValueProps) => {
  const render = resolveCell(cell);

  const badgeClass = clsx(
    "flex size-5 shrink-0 items-center justify-center rounded-full",
    featured ? "bg-background" : "bg-muted",
  );

  return (
    <>
      <span className="sr-only">{render.label}</span>

      {render.kind === "check" && (
        <span className="flex items-center gap-2" aria-hidden>
          <span className={badgeClass}>
            <Check className={CHECK_GLYPH} />
          </span>
          {render.value && (
            <span className="text-14 text-foreground">{render.value}</span>
          )}
        </span>
      )}

      {render.kind === "partial" && (
        <span className="flex items-center gap-2" aria-hidden>
          <span className={badgeClass}>
            <Minus className={ICON_GLYPH} />
          </span>
          {render.value && (
            <span className="text-14 text-muted-foreground">{render.value}</span>
          )}
        </span>
      )}

      {render.kind === "cross" && (
        <span className={badgeClass} aria-hidden>
          <X className={ICON_GLYPH} />
        </span>
      )}

      {render.kind === "text" && (
        <span className="text-14 text-foreground" aria-hidden>
          {render.value}
        </span>
      )}

      {render.kind === "list" && (
        <span className="flex flex-col gap-1.5" aria-hidden>
          {render.values.map((item) => (
            <span key={item} className="flex items-center gap-2">
              <Check className="size-4 shrink-0 text-foreground" />
              <span className="text-14 text-foreground">{item}</span>
            </span>
          ))}
        </span>
      )}

      {render.kind === "addon" && (
        <span
          className="inline-flex items-center rounded-full bg-foreground px-2.5 py-0.5 text-12 font-medium text-background"
          aria-hidden
        >
          {render.value}
        </span>
      )}
    </>
  );
};
