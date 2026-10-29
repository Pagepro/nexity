"use client";

import dynamic from "next/dynamic";

export const FeatureAccordion = dynamic(() =>
  import("./feature-accordion").then((module) => module.FeatureAccordion),
);

export const FeatureHint = dynamic(() =>
  import("./feature-hint").then((module) => module.FeatureHint),
);
