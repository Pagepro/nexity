"use client";

import { useIsPresentationTool } from "next-sanity/hooks";
import { useSyncExternalStore } from "react";
import { VscBeakerStop } from "react-icons/vsc";

const subscribeToNothing = () => () => {};
const getIsTopWindow = () => window.self === window.top;
const getIsTopWindowOnServer = () => false;

export const DisableDraftModeButton = () => {
  const isTopWindow = useSyncExternalStore(
    subscribeToNothing,
    getIsTopWindow,
    getIsTopWindowOnServer,
  );
  const isPresentationTool = useIsPresentationTool();

  // `isPresentationTool` is `null` while the environment is still being detected.
  if (!isTopWindow || isPresentationTool !== false) return null;

  return (
    // A plain <a>: a route handler, not a page, and <Link> prefetching it would exit draft mode.
    // eslint-disable-next-line next/no-html-link-for-pages
    <a
      href="/api/draft-mode/disable"
      className="fixed right-4 bottom-4 z-50 inline-flex items-center gap-2 rounded-full bg-destructive px-4 py-2 text-14 font-medium text-destructive-foreground shadow-lg transition-opacity hover:opacity-90"
    >
      <VscBeakerStop className="size-4 shrink-0" aria-hidden />
      Disable draft mode
    </a>
  );
};
