import "server-only";
import { cache } from "react";

import { apiVersion, projectId } from "@/sanity/lib/env";
import { browserToken } from "@/sanity/lib/token";

// An invalid browserToken makes <SanityLive />'s EventSource retry in a tight 401
// loop that silently burns Sanity API quota, so check it before mounting the stream.
export const isPreviewTokenValid = cache(async (): Promise<boolean> => {
  if (!browserToken) return false;

  try {
    const response = await fetch(
      `https://${projectId}.api.sanity.io/v${apiVersion}/users/me`,
      {
        headers: { Authorization: `Bearer ${browserToken}` },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      console.warn(
        `[preview] SANITY_PREVIEW_TOKEN rejected (HTTP ${response.status}) — skipping <SanityLive /> to avoid a reconnect loop. Live preview updates are disabled until a valid token is set.`,
      );
    }

    return response.ok;
  } catch (error) {
    console.warn(
      "[preview] Could not validate SANITY_PREVIEW_TOKEN — skipping <SanityLive />.",
      error,
    );
    return false;
  }
});
