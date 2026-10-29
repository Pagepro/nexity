import type { PageSection } from "@/types/sections";

import { labelLine } from "./blocks";
import type { MarkdownContext } from "./types";

export type SectionType = PageSection["_type"];

export type SectionData<TType extends SectionType> = Extract<
  PageSection,
  { _type: TType }
>;

// Serializers must stay pure (the test runner loads them): `import type` only from the component side.
export type SectionMarkdownSerializer<TSection> = (
  section: TSection,
  context: MarkdownContext,
) => string;

export const pretitleLine = labelLine;
