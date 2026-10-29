"use client";

import type { ReactNode } from "react";

import { useHasInteracted } from "./interaction-provider";

interface Props {
  children: ReactNode;
}

export const DeferUntilInteraction = ({ children }: Props) => {
  const hasInteracted = useHasInteracted();

  if (!hasInteracted) return null;

  return <>{children}</>;
};
