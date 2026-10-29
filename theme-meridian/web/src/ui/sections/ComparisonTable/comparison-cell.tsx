import { cn } from "@/lib/utils";

import { CellValue } from "./cell-value";
import { Cell } from "./types";

interface ComparisonCellProps {
  cell: Cell | undefined;
  featured: boolean;
}

export const ComparisonCell = ({ cell, featured }: ComparisonCellProps) => (
  <td
    className={cn(
      "border-b border-border p-4 text-left align-middle",
      featured && "bg-card-muted",
    )}
  >
    <CellValue cell={cell} featured={featured} />
  </td>
);
