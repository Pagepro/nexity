import { stegaClean } from "next-sanity";

export const toInitials = (name: string | null | undefined) =>
  stegaClean(name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
