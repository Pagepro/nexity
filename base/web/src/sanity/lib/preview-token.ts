import "server-only";
import { cache } from "react";

import { apiVersion, projectId } from "@/sanity/lib/env";
import { token } from "@/sanity/lib/token";

// An invalid token makes <SanityLive />'s EventSource retry in a tight 401
// loop that silently burns Sanity API quota, so check it before mounting the stream.
export const isPreviewTokenValid = cache(async (): Promise<boolean> => {
  if (!token) return false;

  try {
    const response = await fetch(
      `https://${projectId}.api.sanity.io/v${apiVersion}/users/me`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      console.warn(
        `[preview] SANITY_API_READ_TOKEN rejected (HTTP ${response.status}) — skipping <SanityLive /> to avoid a reconnect loop. Live preview updates are disabled until a valid token is set.`,
      );
    }

    return response.ok;
  } catch (error) {
    console.warn(
      "[preview] Could not validate SANITY_API_READ_TOKEN — skipping <SanityLive />.",
      error,
    );
    return false;
  }
});
