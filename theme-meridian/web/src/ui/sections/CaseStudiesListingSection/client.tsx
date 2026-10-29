"use client";

import ListingGrid from "@/ui/listing/listing-grid";

import CaseStudyCard from "./case-study-card";
import { CATEGORIES } from "./constants";
import { CaseStudy } from "./types";

interface CaseStudiesListingClientProps {
  caseStudies: CaseStudy[];
  total: number;
  perPage: number;
}

const parseResponse = (data: unknown) => {
  const payload = data as { caseStudies?: CaseStudy[]; total?: number };

  return { items: payload.caseStudies ?? [], total: payload.total ?? 0 };
};

const CaseStudiesListingClient = ({
  caseStudies,
  total,
  perPage,
}: CaseStudiesListingClientProps) => (
  <ListingGrid<CaseStudy>
    initialItems={caseStudies}
    initialTotal={total}
    perPage={perPage}
    categories={CATEGORIES}
    apiPath="/api/case-studies"
    parseResponse={parseResponse}
    renderCard={(caseStudy) => (
      <CaseStudyCard key={caseStudy._id} caseStudy={caseStudy} />
    )}
    searchPlaceholder="Search case studies"
    searchLabel="Search case studies"
    emptyLabel="No case studies found"
  />
);

export default CaseStudiesListingClient;
