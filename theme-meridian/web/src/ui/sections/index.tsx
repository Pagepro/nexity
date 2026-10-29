import { createDataAttribute, stegaClean } from "next-sanity";
import React from "react";

import { PageSection } from "@/types/sections";

import { INNER_SECTION_MAP } from "./map";
import { getSectionThemeClassName } from "./section-theme";
import SharedSection from "./SharedSection";
import { SectionMap, SectionsProps } from "./types";

const SECTION_MAP: SectionMap = {
  ...INNER_SECTION_MAP,
  "shared-section-ref": SharedSection,
};

const Sections: React.FC<SectionsProps> = ({
  sections,
  page,
  withDataFirstAttribute = true,
}) => {
  const getAdditionalProps = (_section: PageSection) => ({});
  const visibleSections = (sections ?? []).filter(
    (module) => module && SECTION_MAP[module._type],
  );

  return (
    <>
      {visibleSections.map((section, index) => {
        if (!section) {
          return null;
        }

        const Component: React.ElementType = SECTION_MAP[section._type];

        if (!Component) {
          return null;
        }

        const sectionOptions = (
          section as {
            options?: {
              withTopDivider?: boolean;
              withBottomDivider?: boolean;
              colorTheme?: string;
            };
          }
        ).options;
        const withTopDivider = stegaClean(sectionOptions?.withTopDivider);
        const withBottomDivider = stegaClean(sectionOptions?.withBottomDivider);
        const colorTheme = stegaClean(sectionOptions?.colorTheme);

        return (
          <React.Fragment key={section._key}>
            {withTopDivider && <hr className="section border-foreground/10" />}
            <div className={getSectionThemeClassName(colorTheme)}>
              <Component
                {...section}
                {...getAdditionalProps(section)}
                data-sanity={
                  !!page?._id &&
                  createDataAttribute({
                    id: page._id,
                    type: page?._type,
                    path: `page[_key == "${section._key}"]`,
                  }).toString()
                }
                data-first-module={withDataFirstAttribute && index === 0}
                data-last-module={index === visibleSections.length - 1}
              />
            </div>
            {withBottomDivider && <hr className="section border-foreground/10" />}
          </React.Fragment>
        );
      })}
    </>
  );
};

export default Sections;
