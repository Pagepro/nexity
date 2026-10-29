import { Suspense } from "react";

import sectionProps from "@/lib/sectionProps";

import CaseStudyCard from "./case-study-card";
import CaseStudiesListingClient from "./client-lazy";
import { CASE_STUDIES_PER_PAGE, LISTING_HEADING } from "./constants";
import { CaseStudiesListingSectionProps } from "./types";

const ListingHeading = () => (
  <h2 className="text-30 leading-tight font-medium tracking-tight text-foreground md:text-36">
    {LISTING_HEADING}
  </h2>
);

const CaseStudiesListingFallback = ({
  caseStudies,
}: {
  caseStudies: CaseStudiesListingSectionProps["caseStudies"];
}) => {
  if (!caseStudies || caseStudies.length === 0) return null;

  return (
    <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {caseStudies.map((caseStudy) => (
        <CaseStudyCard key={caseStudy._id} caseStudy={caseStudy} />
      ))}
    </div>
  );
};

const CaseStudiesListingSection = ({
  caseStudies = [],
  total = 0,
  perPage,
  ...props
}: CaseStudiesListingSectionProps) => (
  <section className="section pt-8 pb-8 md:pt-16 md:pb-12" {...sectionProps(props)}>
    <ListingHeading />
    <Suspense fallback={<CaseStudiesListingFallback caseStudies={caseStudies} />}>
      <CaseStudiesListingClient
        caseStudies={caseStudies}
        total={total}
        perPage={perPage ?? CASE_STUDIES_PER_PAGE}
      />
    </Suspense>
  </section>
);

export default CaseStudiesListingSection;
