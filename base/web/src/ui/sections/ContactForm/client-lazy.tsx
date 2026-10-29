"use client";

import dynamic from "next/dynamic";

export const ContactFormClient = dynamic(() =>
  import("./client").then((module) => module.ContactFormClient),
);
