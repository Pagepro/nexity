import { CaseStudiesPageQueryResult } from "@/types/sanity.types";
import { ExtractSectionProps } from "@/types/sections";

export type CaseStudy = CaseStudiesPageQueryResult["caseStudies"][number];

/** `caseStudies`/`total` are injected by `case-studies/page.tsx`, not stored; optional so the component stays assignable to `SectionMap`. */
export interface CaseStudiesListingSectionProps extends ExtractSectionProps<"case-studies-listing"> {
  caseStudies?: CaseStudy[];
  total?: number;
}
