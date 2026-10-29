import clsx from "clsx";

import { TableValue } from "./types";

const BADGE_VALUES = new Set(["high", "medium", "low", "yes", "no"]);
const DESTRUCTIVE_VALUES = new Set(["low", "no"]);

const Cell = ({ value }: { value: string }) => {
  const normalized = value.trim().toLowerCase();

  if (BADGE_VALUES.has(normalized)) {
    return (
      <span
        className={clsx(
          "inline-flex items-center rounded-full px-2 py-0.5 text-12 font-medium",
          DESTRUCTIVE_VALUES.has(normalized)
            ? "bg-destructive/10 text-destructive"
            : "bg-primary text-primary-foreground",
        )}
      >
        {value}
      </span>
    );
  }

  return <>{value}</>;
};

const RichTextTable: React.FC<{ value: TableValue }> = ({ value }) => {
  const rows = value.rows ?? [];

  if (!rows.length) return null;

  const [headerRow, ...bodyRows] = rows;

  return (
    <div className="richtext-embed overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-14">
        {headerRow?.cells?.length ? (
          <thead>
            <tr>
              {headerRow.cells.map((cell, index) => (
                <th
                  key={index}
                  className="border-b border-border px-4 py-2 text-left font-medium text-foreground"
                >
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
        ) : null}
        <tbody>
          {bodyRows.map((row, rowIndex) => {
            const isLastRow = rowIndex === bodyRows.length - 1;

            return (
              <tr key={row._key} className="even:bg-muted/50">
                {row.cells?.map((cell, index) => (
                  <td
                    key={index}
                    className={clsx(
                      "px-4 py-3 align-middle text-foreground",
                      !isLastRow && "border-b border-border",
                    )}
                  >
                    <Cell value={cell} />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default RichTextTable;
