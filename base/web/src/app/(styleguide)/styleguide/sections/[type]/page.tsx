import { notFound } from "next/navigation";

import { SectionDetail } from "@/ui/styleguide/sections-gallery/detail";
import {
  SECTION_TYPES,
  SectionType,
} from "@/ui/styleguide/sections-gallery/fixtures-registry";
import {
  getDocumentsUsingSection,
  getSectionUsage,
} from "@/ui/styleguide/sections-gallery/usage";
import { StudioAuthGate } from "@/ui/styleguide/studio-auth-gate";

export const revalidate = 300;

// Rendered on first visit, not at build: every deploy paid two Sanity reads per section type
// for a page only editors open.
export const generateStaticParams = async () => [];

const isSectionType = (value: string): value is SectionType =>
  (SECTION_TYPES as readonly string[]).includes(value);

const SectionDetailPage = async ({ params }: { params: Promise<{ type: string }> }) => {
  const { type } = await params;

  if (!isSectionType(type)) {
    notFound();
  }

  const [usingDocuments, usage] = await Promise.all([
    getDocumentsUsingSection(type),
    getSectionUsage(),
  ]);

  return (
    <StudioAuthGate>
      <SectionDetail
        type={type}
        usingDocuments={usingDocuments}
        definedInBundles={usage[type].definedInBundles}
      />
    </StudioAuthGate>
  );
};

export default SectionDetailPage;
