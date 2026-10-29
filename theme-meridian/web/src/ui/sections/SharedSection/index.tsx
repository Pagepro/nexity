import { stegaClean } from "next-sanity";
import React from "react";

import { INNER_SECTION_MAP, InnerSectionKey } from "../map";

import { SharedSectionProps } from "./types";

const SharedSection = ({
  sharedSections,
  "data-first-module": dataFirstModule,
  "data-last-module": dataLastModule,
}: SharedSectionProps) => {
  const innerSections = (sharedSections ?? []).flatMap(
    (shared) => shared?.sections ?? [],
  );

  if (!innerSections.length) {
    return null;
  }

  return (
    <>
      {innerSections.map((section, index) => {
        const sectionType = stegaClean(section._type) as InnerSectionKey;
        const Component = INNER_SECTION_MAP[sectionType] as React.ElementType;

        if (!Component) {
          return null;
        }

        return (
          <Component
            key={section._key}
            {...section}
            data-first-module={dataFirstModule && index === 0}
            data-last-module={dataLastModule && index === innerSections.length - 1}
          />
        );
      })}
    </>
  );
};

export default SharedSection;
