"use client";

import dynamic from "next/dynamic";

export const ImpactCalculatorClient = dynamic(() =>
  import("./client").then((module) => module.ImpactCalculatorClient),
);
