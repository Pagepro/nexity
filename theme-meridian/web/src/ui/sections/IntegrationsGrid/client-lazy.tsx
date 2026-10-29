"use client";

import dynamic from "next/dynamic";

export const IntegrationsGridClient = dynamic(() =>
  import("./client").then((module) => module.IntegrationsGridClient),
);
