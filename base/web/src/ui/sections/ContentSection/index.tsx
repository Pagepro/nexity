import clsx from "clsx";

import sectionProps from "@/lib/sectionProps";

import RichText from "../../RichText";

import { ContentSectionProps } from "./types";

const ContentSection: React.FC<ContentSectionProps> = ({ content, ...props }) => (
  <section
    className={clsx("section pt-10 pb-10 md:pt-25 md:pb-25")}
    {...sectionProps(props)}
  >
    <div className="text-foreground">
      {!!content?.length && <RichText value={content} />}
    </div>
  </section>
);

export default ContentSection;
