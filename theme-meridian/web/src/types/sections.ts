import { PageQueryResult } from "./sanity.types";

export type PageSections = NonNullable<NonNullable<PageQueryResult>["sections"]>;

export type PageSection = NonNullable<PageSections[number]>;

export type ExtractSectionProps<T extends PageSection["_type"]> = Extract<
  PageSection,
  { _type: T }
>;
