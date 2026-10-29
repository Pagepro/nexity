import { ExtractSectionProps } from "@/types/sections";

export type StatsProps = ExtractSectionProps<"stats">;

export type Stat = NonNullable<StatsProps["stats"]>[number];
