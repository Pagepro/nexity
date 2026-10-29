"use client";

import dynamic from "next/dynamic";

export const LogosTrack = dynamic(() =>
  import("./client").then((module) => module.LogosTrack),
);
