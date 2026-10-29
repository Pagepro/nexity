import { createImageUrlBuilder } from "@sanity/image-url";

import { dataset, projectId } from "@/sanity/lib/env";
import { ImageFragment } from "@/types/fragments";

// Not built from the Sanity `client`: `<Img>` renders in client components, and
// that would pull @sanity/client (~30 KB gz) into every page's browser bundle.
const builder = createImageUrlBuilder({ projectId, dataset });

export function urlFor(image: ImageFragment["image"]) {
  return builder.image({
    ...image,
    url: image?.asset?.url || undefined,
  });
}
