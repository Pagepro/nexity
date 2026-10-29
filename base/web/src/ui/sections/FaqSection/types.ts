import { ExtractSectionProps } from "@/types/sections";

export type FaqProps = ExtractSectionProps<"faq">;

export type FaqItem = NonNullable<FaqProps["items"]>[number];
