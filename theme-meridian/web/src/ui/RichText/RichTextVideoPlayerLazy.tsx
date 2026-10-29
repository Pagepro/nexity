"use client";

import dynamic from "next/dynamic";

// Own chunk: a static import would put the player in nearly every page's first-load JS.
export const RichTextVideoPlayer = dynamic(() => import("./RichTextVideoPlayer"));
