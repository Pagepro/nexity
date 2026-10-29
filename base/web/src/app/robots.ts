import type { MetadataRoute } from "next";

import { IS_INDEXABLE } from "@/lib/env";

// Switched by `IS_INDEXABLE` (lib/env.ts): "false" blocks every host, an unset flag
// allows only a Vercel production deployment.
export default function robots(): MetadataRoute.Robots {
  const domain = process.env.NEXT_PUBLIC_BASE_URL + "/";

  return {
    rules: [
      ...(IS_INDEXABLE
        ? [
            {
              userAgent: "*",
              allow: "/",
            },
          ]
        : [
            {
              userAgent: "*",
              disallow: "/",
            },
          ]),
      {
        userAgent: "*",
        crawlDelay: 10,
      },
      {
        userAgent: "*",
        disallow: ["/privacy-policy", "/admin"],
      },
    ],
    host: domain,
    sitemap: `${domain}sitemap.xml`,
  };
}

export const dynamic = "force-dynamic";
