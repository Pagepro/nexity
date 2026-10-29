import { toPlainText } from "next-sanity";
import { type PortableTextBlock } from "sanity";

import { ImageFragment } from "@/types/fragments";
import { Quote } from "@/ui/components/quote";

export interface QuoteData {
  author?: string | null;
  role?: string | null;
  company?: string | null;
  avatar?: ImageFragment | null;
  quote?: PortableTextBlock[] | null;
}

interface QuoteBlockProps {
  quote: QuoteData;
}

export const QuoteBlock = ({ quote }: QuoteBlockProps) => {
  const text = quote.quote ? toPlainText(quote.quote) : "";

  if (!text) {
    return null;
  }

  return (
    <section className="bg-section-surface-muted py-12 md:py-24">
      <div className="section flex justify-center">
        <Quote
          text={text}
          author={quote.author}
          role={quote.role}
          company={quote.company}
          avatar={quote.avatar}
        />
      </div>
    </section>
  );
};
