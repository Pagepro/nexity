import { defineQuery } from "groq";

import { RICHTEXT_QUERY } from "@/sanity/lib/queries";

export const GATED_RESOURCE_QUERY =
  defineQuery(`*[_type == 'gated-resource' && _id == $id][0]{
  title,
  content[]{ ${RICHTEXT_QUERY} },
  files[defined(file.asset)]{
    _key,
    label,
    "url": file.asset->url,
    "filename": file.asset->originalFilename,
    "extension": file.asset->extension,
    "size": file.asset->size
  }
}`);
