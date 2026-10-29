import { ExtractSectionProps } from "@/types/sections";

export type BentoGridProps = ExtractSectionProps<"bento-grid">;

export type BentoCard = NonNullable<BentoGridProps["cards"]>[number];
