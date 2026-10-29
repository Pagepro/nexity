import { ExtractSectionProps } from "@/types/sections";

export type ComparisonTableProps = ExtractSectionProps<"comparison-table">;

export type Plan = NonNullable<ComparisonTableProps["plans"]>[number];

export type FeatureGroup = NonNullable<ComparisonTableProps["featureGroups"]>[number];

export type FeatureRow = NonNullable<FeatureGroup["rows"]>[number];

export type Cell = NonNullable<FeatureRow["cells"]>[number];
