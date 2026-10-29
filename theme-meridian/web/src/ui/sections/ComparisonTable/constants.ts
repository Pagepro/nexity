// Pure (no `next-sanity`, type-only imports) so the Markdown serializer and its
// test runner can reuse `resolveCell`.
import { stegaClean } from "@sanity/client/stega";

import type { Cell } from "./types";

export const ADDON_LABEL = "Add-on";

export type CellRender =
  | { kind: "check"; value: string | null; label: string }
  | { kind: "cross"; label: string }
  | { kind: "partial"; value: string | null; label: string }
  | { kind: "text"; value: string; label: string }
  | { kind: "addon"; value: string; label: string }
  | { kind: "list"; values: string[]; label: string };

export const resolveCell = (cell: Cell | undefined): CellRender => {
  // `state`/`value` feed conditionals, so strip visual-editing encoding first.
  const state = stegaClean(cell?.state) || "included";
  const value = stegaClean(cell?.value)?.trim() || null;

  if (state === "excluded") {
    return { kind: "cross", label: "Not included" };
  }

  if (state === "partial") {
    return value
      ? { kind: "partial", value, label: `Partially included: ${value}` }
      : { kind: "partial", value: null, label: "Partially included" };
  }

  if (state === "addon") {
    const pill = value || ADDON_LABEL;
    return { kind: "addon", value: pill, label: `Available as an add-on (${pill})` };
  }

  if (state === "list") {
    const values = (cell?.values ?? [])
      .map((item) => stegaClean(item)?.trim())
      .filter((item): item is string => Boolean(item));
    return values.length
      ? { kind: "list", values, label: `Included: ${values.join(", ")}` }
      : { kind: "cross", label: "Not included" };
  }

  if (state === "text") {
    return value
      ? { kind: "text", value, label: value }
      : { kind: "cross", label: "Not included" };
  }

  return value
    ? { kind: "check", value, label: `Included: ${value}` }
    : { kind: "check", value: null, label: "Included" };
};
