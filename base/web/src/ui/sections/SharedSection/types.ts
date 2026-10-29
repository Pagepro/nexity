import { ExtractSectionProps } from "@/types/sections";

export type SharedSectionProps = ExtractSectionProps<"shared-section-ref"> & {
  "data-first-module"?: boolean;
  "data-last-module"?: boolean;
};
