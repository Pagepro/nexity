import { ExtractSectionProps } from "@/types/sections";

export type TestimonialsProps = ExtractSectionProps<"testimonials">;

export type Testimonial = NonNullable<TestimonialsProps["testimonials"]>[number];
