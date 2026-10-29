import { stegaClean } from "next-sanity";

import sectionProps from "@/lib/sectionProps";
import RichText from "@/ui/RichText";

import { TestimonialsCarousel } from "./client-lazy";
import { FeaturedTestimonial } from "./featured-testimonial";
import { TestimonialCard } from "./testimonial-card";
import { TestimonialsProps } from "./types";

const TestimonialsSection = ({
  layout,
  mark,
  pretitle,
  content,
  testimonials,
  ...props
}: TestimonialsProps) => {
  if (!testimonials?.length) {
    return null;
  }

  const featured = testimonials.find(Boolean);
  if (stegaClean(layout) === "featured" && featured) {
    return (
      <section className="py-12 md:py-24" {...sectionProps(props)}>
        <div className="section flex justify-center">
          <FeaturedTestimonial testimonial={featured} mark={mark} />
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 md:py-24" {...sectionProps(props)}>
      <div className="section flex flex-col items-center gap-8 md:gap-12">
        {(pretitle || content) && (
          <div className="flex max-w-xl flex-col items-center gap-4 text-center text-balance">
            {pretitle && <p className="pretitle">{pretitle}</p>}
            {content && <RichText value={content} />}
          </div>
        )}

        <TestimonialsCarousel
          slides={testimonials.map((testimonial) => ({
            key: testimonial._id,
            card: <TestimonialCard testimonial={testimonial} />,
          }))}
        />
      </div>
    </section>
  );
};

export default TestimonialsSection;
