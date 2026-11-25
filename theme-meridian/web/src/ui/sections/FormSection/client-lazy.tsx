"use client";

import dynamic from "next/dynamic";

export const FormSectionClient = dynamic(() =>
  import("./client").then((module) => module.FormSectionClient),
);
