import Image from "@/ui/components/image";
import RichText from "@/ui/RichText";

import { PersonByline } from "./person-byline";
import { PlatformLinks } from "./platform-links";
import { PodcastPage } from "./types";

interface PodcastHeroProps {
  page: PodcastPage;
}

export const PodcastHero = ({ page }: PodcastHeroProps) => {
  const hasCover = !!page.coverArt?.image?.asset;

  return (
    <section className="section flex flex-col items-center gap-12 pb-12 md:flex-row md:pb-20 lg:gap-20">
      <div className="flex flex-1 flex-col gap-6">
        <div className="flex flex-col gap-4 text-balance">
          {page.pretitle && <p className="pretitle">{page.pretitle}</p>}
          <h1 className="text-36 leading-tighter font-medium tracking-tight text-foreground md:text-44">
            {page.title}
          </h1>
          {page.content && <RichText value={page.content} className="max-w-xl" />}
        </div>

        <PersonByline person={page.host} prefix="Hosted by" />

        <PlatformLinks links={page.platformLinks} />
      </div>

      <div className="w-full max-w-sm shrink-0 md:w-80 md:max-w-none lg:w-110">
        <div className="relative flex aspect-square flex-col justify-between overflow-hidden rounded-lg border border-border bg-card-muted p-8 shadow-sm">
          {hasCover ? (
            <div className="absolute inset-0">
              <Image
                sanityImage={page.coverArt!}
                sizes="(min-width: 1024px) 440px, (min-width: 768px) 320px, min(100vw, 24rem)"
                className="object-cover"
                fill
              />
            </div>
          ) : (
            <>
              <span className="size-30 rounded-full bg-foreground" aria-hidden />
              <div>
                <p className="text-30 leading-none font-medium tracking-tight text-foreground">
                  {page.title}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
