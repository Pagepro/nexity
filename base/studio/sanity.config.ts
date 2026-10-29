import { createSanityConfig } from "./src/sanity/config";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID!;
const dataset = process.env.SANITY_STUDIO_DATASET!;
const apiVersion = process.env.SANITY_STUDIO_API_VERSION || "2024-12-01";

export default createSanityConfig({
  projectId,
  dataset,
  apiVersion,
  basePath: "/admin",
  productionUrl: async (prev, { document }) => {
    if (["page"].includes(document?._type)) {
      const slug = (
        document as Record<string, unknown> & {
          metadata?: { slug?: { current?: string } };
        }
      )?.metadata?.slug?.current;

      return slug
        ? `${process.env.NEXT_PUBLIC_BASE_URL}${slug.startsWith("/") ? slug : `/${slug}`}`
        : prev;
    }

    return prev;
  },
});
