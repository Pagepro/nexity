import { ExtractSectionProps } from "@/types/sections";

export type PricingProps = ExtractSectionProps<"pricing">;

export type Plan = NonNullable<PricingProps["plans"]>[number];
