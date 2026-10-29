import { LinkFragment } from "@/types/fragments";
import { BaseLink } from "@/ui/components/Link/BaseLink";

import { RichTextLinkPreview } from "./RichTextLinkPreview";
import { LinkPreview } from "./types";

type RichTextLinkValue = LinkFragment & {
  internal?: { preview?: LinkPreview | null } | null;
};

const LINK_CLASS = "underline transition-colors hover:text-foreground/70";

// Server component: only a link with a preview renders the client hover card.
const RichTextLink: React.FC<{
  value?: RichTextLinkValue;
  children: React.ReactNode;
}> = ({ value, children }) => {
  if (!value) {
    return <>{children}</>;
  }

  const preview = value.internal?.preview;
  const hasPreview = Boolean(preview && (preview.title || preview.image?.image));

  if (!preview || !hasPreview) {
    return (
      <BaseLink link={value} className={LINK_CLASS}>
        {children}
      </BaseLink>
    );
  }

  return (
    <RichTextLinkPreview link={value} preview={preview} className={LINK_CLASS}>
      {children}
    </RichTextLinkPreview>
  );
};

export default RichTextLink;
