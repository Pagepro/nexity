import { toPlainText } from "next-sanity";

import { Quote } from "@/ui/components/quote";

import { Testimonial, TestimonialsProps } from "./types";

interface FeaturedTestimonialProps {
  testimonial: Testimonial;
  mark: TestimonialsProps["mark"];
}

export const FeaturedTestimonial = ({ testimonial, mark }: FeaturedTestimonialProps) => {
  const { quote, author, role, company, avatar } = testimonial;

  return (
    <Quote
      text={quote ? toPlainText(quote) : ""}
      author={author}
      role={role}
      company={company}
      avatar={avatar}
      mark={mark}
    />
  );
};
