"use client";

import dynamic from "next/dynamic";

export const PricingPlans = dynamic(() =>
  import("./client").then((module) => module.PricingPlans),
);

export const PlanPrice = dynamic(() =>
  import("./client").then((module) => module.PlanPrice),
);
