"use client";

import dynamic from "next/dynamic";

import { DeferUntilInteraction } from "@/ui/providers/defer-until-interaction";

// Keep c15t (~53 KB gz) out of the page's initial JS: it competes with the LCP image
// and hydration. Loaded after the first interaction or idle (see InteractionProvider).
const ConsentManager = dynamic(() => import("./consent-manager"), { ssr: false });

export const ConsentManagerLazy = () => (
  <DeferUntilInteraction>
    <ConsentManager />
  </DeferUntilInteraction>
);
