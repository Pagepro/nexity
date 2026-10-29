import Link from "next/link";

import { formatListingMeta } from "@/ui/listing/listing-utils";

import Image from "../../components/image";

import { CaseStudy } from "./types";

const CaseStudyCard = ({ caseStudy }: { caseStudy: CaseStudy }) => {
  const meta = formatListingMeta(
    caseStudy.category ?? caseStudy.eyebrow,
    caseStudy.publishedAt,
  );
  const href = caseStudy.slug ? `/case-studies/${caseStudy.slug}` : "#";

  return (
    <Link
      href={href}
      className="card-frame group flex h-full flex-col gap-6 overflow-hidden rounded-lg border-4 border-background bg-card p-6 shadow-card transition-shadow hover:shadow-xl"
    >
      <div className="flex flex-col gap-3">
        {meta && (
          <p className="text-10 font-medium tracking-wider text-muted-foreground uppercase">
            {meta}
          </p>
        )}
        <h3 className="text-18 leading-snug font-medium text-balance text-foreground transition-colors group-hover:text-foreground/70">
          {caseStudy.title}
        </h3>
      </div>

      {caseStudy.image?.image?.asset && (
        <div className="relative mt-auto aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted">
          <Image
            sanityImage={caseStudy.image}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}
    </Link>
  );
};

export default CaseStudyCard;
