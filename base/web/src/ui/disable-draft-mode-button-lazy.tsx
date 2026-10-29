"use client";

import dynamic from "next/dynamic";

// Must stay lazy: a static import puts next-sanity/hooks (~250 KB gz) in every visitor's
// layout chunk, though the button renders only in draft mode.
export const DisableDraftModeButton = dynamic(
  () =>
    import("./disable-draft-mode-button").then((module) => module.DisableDraftModeButton),
  { ssr: false },
);
