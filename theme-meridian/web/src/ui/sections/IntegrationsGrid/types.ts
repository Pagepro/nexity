import { ExtractSectionProps } from "@/types/sections";

export type IntegrationsGridProps = ExtractSectionProps<"integrations-grid">;

export type Integration = NonNullable<IntegrationsGridProps["integrations"]>[number];
