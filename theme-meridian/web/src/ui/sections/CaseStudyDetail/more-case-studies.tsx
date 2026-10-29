import { FeatureCard } from "@/ui/sections/FeatureGrid/feature-card";
import { CaseStudyCardData } from "@/ui/sections/FeatureGrid/types";
import { caseStudyToCard } from "@/ui/sections/FeatureGrid/utils";

interface MoreCaseStudiesProps {
  items: CaseStudyCardData[];
}

export const MoreCaseStudies = ({ items }: MoreCaseStudiesProps) => {
  if (!items.length) return null;

  return (
    <section className="section py-12 md:py-24">
      <div className="flex flex-col items-center gap-12">
        <div className="flex flex-col items-center gap-4">
          <p className="pretitle">Read more</p>
          <h2 className="max-w-xl text-center text-30 leading-tight font-medium tracking-tight text-balance md:text-36">
            More case studies
          </h2>
        </div>

        <div className="grid w-full gap-8 md:grid-cols-3">
          {items.map((item, index) => (
            <FeatureCard key={item._id} card={caseStudyToCard(item)} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};
