import { VisualEditing } from "next-sanity/visual-editing";
import { draftMode } from "next/headers";

import { SanityLive } from "@/sanity/lib/fetch";
import { isPreviewTokenValid } from "@/sanity/lib/preview-token";

import { DisableDraftModeButton } from "./disable-draft-mode-button-lazy";
import PreviewTokenBanner from "./PreviewTokenBanner";

// Must return null outside draft mode: <SanityLive /> is billed and editor-only,
// and an invalid read token makes its SSE stream loop on 401 and burn quota.
const VisualEditingControls = async () => {
  const { isEnabled: isDraftMode } = await draftMode();

  if (!isDraftMode) return null;

  const previewTokenValid = await isPreviewTokenValid();

  return (
    <>
      {previewTokenValid ? <SanityLive /> : <PreviewTokenBanner />}
      <VisualEditing />
      <DisableDraftModeButton />
    </>
  );
};

export default VisualEditingControls;
