import sectionProps from "@/lib/sectionProps";
import Image from "@/ui/components/image";

import { LogosTrack } from "./client-lazy";
import { LogosCarouselProps } from "./types";

const LogosCarousel = ({ logos, speed, ...props }: LogosCarouselProps) => {
  if (!logos?.length) {
    return null;
  }

  return (
    <section className="pt-12 md:pt-24" {...sectionProps(props)}>
      <div className="section">
        <LogosTrack
          speed={speed}
          slides={logos.map((logo) => ({
            key: logo._key,
            logo: (
              <Image
                sanityImage={logo}
                sizes="192px"
                className="h-6 w-auto object-contain grayscale"
              />
            ),
          }))}
        />
      </div>
    </section>
  );
};

export default LogosCarousel;
