import type { NextConfig } from "next";

import { SANITY_CDN_REWRITE } from "./src/lib/sanity-cdn-proxy";
import { SITEMAP_REDIRECT, SITEMAP_REWRITE } from "./src/lib/sitemap";
import { STATUS_PAGE_REWRITES } from "./src/lib/status-pages";
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
  async redirects() {
    return [SITEMAP_REDIRECT];
  },

  async rewrites() {
    return {
      beforeFiles: STATUS_PAGE_REWRITES,
      afterFiles: [SANITY_CDN_REWRITE, SITEMAP_REWRITE],
    };
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
