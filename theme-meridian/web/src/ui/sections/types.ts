import { PageQueryResult } from "@/types/sanity.types";
import { PageSection, PageSections } from "@/types/sections";

export type SectionMap = {
  [Key in PageSection["_type"]]: React.FC<Extract<PageSection, { _type: Key }>>;
};

export interface SectionsProps {
  sections: PageSections | null;
  page?: { _id?: string; _type?: string } | PageQueryResult | null;
  withDataFirstAttribute?: boolean;
}
