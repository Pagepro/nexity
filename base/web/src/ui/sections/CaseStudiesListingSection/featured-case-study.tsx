import Link from "next/link";

import { formatListingMeta } from "@/ui/listing/listing-utils";

import Image from "../../components/image";

import { CaseStudy } from "./types";

const FeaturedCaseStudy = ({ caseStudy }: { caseStudy: CaseStudy }) => {
  const meta = formatListingMeta(
    caseStudy.category ?? caseStudy.eyebrow,
    caseStudy.publishedAt,
  );
  const href = caseStudy.slug ? `/case-studies/${caseStudy.slug}` : "#";
  const metrics = caseStudy.metrics?.slice(0, 3) ?? [];

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card p-1.5 shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-16">
        <div className="flex flex-col justify-between gap-8 p-6 lg:basis-5/12 lg:p-10">
          <div className="flex flex-col gap-5">
            {meta && (
              <p className="text-10 font-medium tracking-wider text-muted-foreground uppercase">
                {meta}
              </p>
            )}
            <h2 className="text-30 leading-tight font-medium text-balance text-foreground md:text-36">
              <Link href={href} className="transition-colors hover:text-foreground/70">
                {caseStudy.title}
              </Link>
            </h2>
            {caseStudy.excerpt && (
              <p className="text-16 leading-relaxed text-muted-foreground">
                {caseStudy.excerpt}
              </p>
            )}
            {metrics.length > 0 && (
              <dl className="flex flex-wrap gap-x-10 gap-y-4">
                {metrics.map((metric) => (
                  <div key={metric.label} className="flex flex-col gap-1">
                    <dt className="text-30 leading-none font-medium text-foreground md:text-36">
                      {metric.value}
                    </dt>
                    <dd className="text-12 text-muted-foreground">{metric.label}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          <Link
            href={href}
            className="inline-flex h-9 w-fit items-center justify-center rounded-md border border-input px-4 text-14 font-medium text-foreground transition-colors hover:bg-foreground/5"
          >
            Read case study
          </Link>
        </div>

        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-muted lg:aspect-auto lg:basis-7/12">
          {caseStudy.image?.image?.asset && (
            <Image
              sanityImage={caseStudy.image}
              fill
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default FeaturedCaseStudy;
