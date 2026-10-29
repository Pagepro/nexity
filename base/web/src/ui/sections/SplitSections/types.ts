import { ExtractSectionProps } from "@/types/sections";

export type SplitSectionsProps = ExtractSectionProps<"split-sections">;

export type SplitRow = NonNullable<SplitSectionsProps["rows"]>[number];
