import { blockquote, joinBlocks } from "@/lib/markdown/blocks";
import { cleanText, markdownText } from "@/lib/markdown/escape";
import {
  portableTextToMarkdown,
  portableTextToPlainText,
} from "@/lib/markdown/portable-text";
import {
  pretitleLine,
  type SectionData,
  type SectionMarkdownSerializer,
} from "@/lib/markdown/sections";

type Testimonial = NonNullable<
  NonNullable<SectionData<"testimonials">["testimonials"]>[number]
>;

const testimonialQuote = (testimonial: Testimonial): string => {
  const quote = markdownText(portableTextToPlainText(testimonial.quote)).replace(
    /\n/g,
    "  \n",
  );
  if (!quote) return "";

  const attribution = [testimonial.author, testimonial.role, testimonial.company]
    .map((value) => markdownText(value))
    .filter(Boolean)
    .join(", ");

  return blockquote(joinBlocks([quote, attribution && `— ${attribution}`]));
};

export const testimonialsToMarkdown: SectionMarkdownSerializer<
  SectionData<"testimonials">
> = (section, context) => {
  const testimonials = (section.testimonials ?? []).filter((item): item is Testimonial =>
    Boolean(item),
  );
  if (testimonials.length === 0) return "";

  if (cleanText(section.layout) === "featured") return testimonialQuote(testimonials[0]);

  return joinBlocks([
    pretitleLine(section.pretitle),
    portableTextToMarkdown(section.content, context),
    ...testimonials.map(testimonialQuote),
  ]);
};
