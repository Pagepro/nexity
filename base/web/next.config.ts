import type { NextConfig } from "next";

import { SANITY_CDN_REWRITE } from "./src/lib/sanity-cdn-proxy";
import { resolveBaseUrl } from "./src/setup/base-url";

export default {
  transpilePackages: ["@nexity/studio"],
  images: {
    formats: ["image/avif", "image/webp"],
    dangerouslyAllowSVG: true,
    qualities: [75, 80, 85, 90],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },

  // No CMS redirects here: src/proxy.ts resolves them per request. Config redirects
  // run first and would keep a deleted redirect alive until the next deploy.

  async rewrites() {
    return [SANITY_CDN_REWRITE];
  },

  turbopack: {
    rules: {
      "*.svg": {
        loaders: [
          {
            loader: "@svgr/webpack",
            options: {
              icon: true,
            },
          },
        ],
        as: "*.js",
      },
    },
  },

  env: {
    SC_DISABLE_SPEEDY: "false",
    NEXT_PUBLIC_BASE_URL: resolveBaseUrl(),
  },

  reactCompiler: true,
  experimental: {
    inlineCss: true,
    turbopackFileSystemCacheForDev: true,
  },
} satisfies NextConfig;
