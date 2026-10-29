import { PortableText, type PortableTextProps } from "@portabletext/react";
import clsx from "clsx";
import React, { useMemo } from "react";

import { BODY_STYLES, HEADING_STYLES, SECTION_HEADING_STYLES } from "./block-styles";
import RichTextCallout from "./RichTextCallout";
import RichTextChecklist from "./RichTextChecklist";
import RichTextCode from "./RichTextCode";
import RichTextImage from "./RichTextImage";
import RichTextLink from "./RichTextLink";
import RichTextPullquote from "./RichTextPullquote";
import RichTextTable from "./RichTextTable";
import RichTextVideo from "./RichTextVideo";
import { MyPortableTextProps } from "./types";
import { hasMultilineItems, isTitledItem } from "./utils";

const RichText: React.FC<MyPortableTextProps> = ({ value: propsValue, className }) => {
  const components: PortableTextProps["components"] = useMemo(
    () => ({
      marks: {
        link: ({ children, value }) => (
          <RichTextLink value={value}>{children}</RichTextLink>
        ),
        sub: ({ children }) => <sub>{children}</sub>,
        sup: ({ children }) => <sup>{children}</sup>,
        simplerColor: ({ value, children }) => (
          <span style={{ color: (value as { value: string }).value }}>{children}</span>
        ),
        left: ({ children }) => <span className="block text-left">{children}</span>,
        center: ({ children }) => <span className="block text-center">{children}</span>,
        right: ({ children }) => <span className="block text-right">{children}</span>,
        strong: ({ children }) => <strong className="font-bold">{children}</strong>,
        medium: ({ children }) => <span className="font-medium">{children}</span>,
        light: ({ children }) => <span className="font-light">{children}</span>,
      },
      list: {
        bullet: ({ children, value }) => (
          <ul
            className={clsx(
              "ml-5 list-disc text-14 leading-relaxed marker:text-muted-foreground md:text-16",
              hasMultilineItems(value) ? "space-y-4" : "space-y-2.5",
            )}
          >
            {children}
          </ul>
        ),
        number: ({ children, value }) => (
          <ol
            className={clsx(
              "ml-5 list-decimal text-14 leading-relaxed marker:text-muted-foreground md:text-16",
              hasMultilineItems(value) ? "space-y-4" : "space-y-2.5",
            )}
          >
            {children}
          </ol>
        ),
        checkmarks: ({ children }) => (
          <ol className={clsx("m-auto list-none text-sm")}>{children}</ol>
        ),
      },
      listItem: {
        bullet: ({ children, value }) => (
          <li className={clsx("pl-1", isTitledItem(value) && "richtext-titled-item")}>
            {children}
          </li>
        ),
        number: ({ children, value }) => (
          <li className={clsx("pl-1", isTitledItem(value) && "richtext-titled-item")}>
            {children}
          </li>
        ),
      },
      block: {
        // Block-style keys are stored in content: never rename them.
        normal: ({ children }) => <p className={BODY_STYLES["body-2"]}>{children}</p>,
        "body-1": ({ children }) => <p className={BODY_STYLES["body-1"]}>{children}</p>,
        "body-2": ({ children }) => <p className={BODY_STYLES["body-2"]}>{children}</p>,
        "body-3": ({ children }) => <p className={BODY_STYLES["body-3"]}>{children}</p>,
        "body-4": ({ children }) => <p className={BODY_STYLES["body-4"]}>{children}</p>,
        "body-5": ({ children }) => <p className={BODY_STYLES["body-5"]}>{children}</p>,
        "alt-body-1": ({ children }) => (
          <p className={BODY_STYLES["body-1"]}>{children}</p>
        ),
        "alt-body-2": ({ children }) => (
          <p className={BODY_STYLES["body-2"]}>{children}</p>
        ),
        "alt-body-3": ({ children }) => (
          <p className={BODY_STYLES["body-3"]}>{children}</p>
        ),
        "alt-body-4": ({ children }) => (
          <p className={BODY_STYLES["body-4"]}>{children}</p>
        ),
        "alt-body-5": ({ children }) => (
          <p className={BODY_STYLES["body-5"]}>{children}</p>
        ),
        "alt-body-6": ({ children }) => (
          <p className={BODY_STYLES["body-5"]}>{children}</p>
        ),
        "heading-1": ({ children }) => (
          <h1 className={HEADING_STYLES["heading-1"]}>{children}</h1>
        ),
        "heading-2": ({ children }) => (
          <h2 className={HEADING_STYLES["heading-2"]}>{children}</h2>
        ),
        "heading-3": ({ children }) => (
          <h3 className={HEADING_STYLES["heading-3"]}>{children}</h3>
        ),
        "heading-4": ({ children }) => (
          <h4 className={HEADING_STYLES["heading-4"]}>{children}</h4>
        ),
        "heading-5": ({ children }) => (
          <h5 className={HEADING_STYLES["heading-5"]}>{children}</h5>
        ),
        "heading-6": ({ children }) => (
          <h6 className={HEADING_STYLES["heading-6"]}>{children}</h6>
        ),
        "alt-heading-1": ({ children }) => (
          <h2 className={HEADING_STYLES["heading-1"]}>{children}</h2>
        ),
        "alt-heading-2": ({ children }) => (
          <h2 className={HEADING_STYLES["heading-2"]}>{children}</h2>
        ),
        "alt-heading-3": ({ children }) => (
          <h3 className={HEADING_STYLES["heading-3"]}>{children}</h3>
        ),
        "alt-heading-4": ({ children }) => (
          <h4 className={HEADING_STYLES["heading-4"]}>{children}</h4>
        ),
        "alt-heading-5": ({ children }) => (
          <h5 className={HEADING_STYLES["heading-5"]}>{children}</h5>
        ),
        "alt-heading-6": ({ children }) => (
          <h6 className={HEADING_STYLES["heading-6"]}>{children}</h6>
        ),
        "section-heading-xl": ({ children }) => (
          <h2 className={SECTION_HEADING_STYLES["section-heading-xl"]}>{children}</h2>
        ),
        "section-heading-lg": ({ children }) => (
          <h2 className={SECTION_HEADING_STYLES["section-heading-lg"]}>{children}</h2>
        ),
        "section-heading-md": ({ children }) => (
          <h3 className={SECTION_HEADING_STYLES["section-heading-md"]}>{children}</h3>
        ),
        "section-heading-sm": ({ children }) => (
          <h4 className={SECTION_HEADING_STYLES["section-heading-sm"]}>{children}</h4>
        ),
        strong: ({ children }) => <strong className="font-medium">{children}</strong>,
      },
      types: {
        img: RichTextImage,
        pullquote: RichTextPullquote,
        callout: RichTextCallout,
        code: RichTextCode,
        table: RichTextTable,
        // Wrapped so PortableText's non-serializable `renderNode` never reaches a Client Component.
        videoEmbed: ({ value }) => <RichTextVideo value={value} />,
        checklist: RichTextChecklist,
      },
    }),
    [],
  );

  if (!propsValue) {
    return null;
  }

  return (
    <div className={clsx("richtext richtext-flow", className)}>
      <PortableText value={propsValue} components={components} />
    </div>
  );
};

export default RichText;
