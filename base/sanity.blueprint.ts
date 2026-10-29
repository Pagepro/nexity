// What is not declared here is removed from the stack: change these resources here, never in
// sanity.io/manage. Stays at the repo root: the CLI detects the package manager from the lockfile beside it.
//
// Env (web/.env.local, web/.env, or inline for production values):
//   SANITY_BLUEPRINT_SITE_URL      — production origin; unset skips the site CORS origin and the webhook
//   SANITY_BLUEPRINT_EXTRA_ORIGINS — comma-separated credentialed origins (www variant,
//                                    https://*-my-team.vercel.app, http://localhost:3001)
//   SANITY_REVALIDATE_SECRET       — must equal the value set on the production deploy
import {
  defineBlueprint,
  defineCorsOrigin,
  defineDocumentWebhook,
} from "@sanity/blueprints";
import { config as loadEnv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.dirname(fileURLToPath(import.meta.url));

loadEnv({
  path: [path.join(repoRoot, "web", ".env.local"), path.join(repoRoot, "web", ".env")],
  quiet: true,
});

const requireEnv = (name: string) => {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `[blueprint] Missing ${name} (web/.env.local, web/.env or the shell)`,
    );
  }

  return value;
};

// A wildcard over a whole hosting platform matches sites we don't own; with
// credentials it lets them act as a logged-in editor.
const PLATFORM_WILDCARDS = ["*.vercel.app", "*.netlify.app", "*.pages.dev"];

const assertSafeOrigin = (origin: string) => {
  const host = origin.replace(/^https?:\/\//, "");

  if (!/^https?:\/\/[^/]+$/.test(origin)) {
    throw new Error(
      `[blueprint] "${origin}" is not an origin (protocol://host[:port], no path or trailing slash)`,
    );
  }

  if (PLATFORM_WILDCARDS.includes(host)) {
    throw new Error(
      `[blueprint] "${origin}" matches every site on the platform; anchor it to your team scope`,
    );
  }

  return origin;
};

// Never declare localhost:3000 or :3333: Sanity creates them outside the stack, Blueprints can't
// adopt an existing origin, and the first deploy fails with "409 Duplicate origin". The Blueprints
// API also rejects a port wildcard (`http://localhost:*`), so list ports one by one.

// Resources are matched by name, so the name derives from the origin itself.
const corsResourceName = (origin: string) =>
  `cors-${origin
    .replace(/^https?:\/\//, "")
    .replaceAll("*", "wildcard")
    .replace(/[^a-zA-Z0-9]+/g, "-")}`;

const projectId = requireEnv("NEXT_PUBLIC_SANITY_PROJECT_ID");
const dataset = requireEnv("NEXT_PUBLIC_SANITY_DATASET");
const siteUrl = process.env.SANITY_BLUEPRINT_SITE_URL?.trim();
const extraOrigins = (process.env.SANITY_BLUEPRINT_EXTRA_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// The embedded Studio at /admin signs in from the site origin, so every site origin needs
// credentials. Deduplicated: a repeated origin would declare two resources with the same name.
const credentialedOrigins = [
  ...new Set([...(siteUrl ? [siteUrl] : []), ...extraOrigins]),
].map(assertSafeOrigin);

const corsOrigins = credentialedOrigins.map((origin) =>
  defineCorsOrigin({
    name: corsResourceName(origin),
    project: projectId,
    origin,
    allowCredentials: true,
  }),
);

// `/api/revalidate` reads the slug at both `metadata.slug` and top-level `slug`; keep both in the projection.
// `contentOnly` may list only fields no listing, card or link reads (`tagsForDocumentType`).
// `sanity.*`/`system.*` documents (assets, releases, preview secrets) are never rendered and
// would fall through to the purge of every page.
const revalidateWebhook = siteUrl
  ? [
      defineDocumentWebhook({
        name: "revalidate",
        displayName: "Revalidate Next.js cache tags",
        project: projectId,
        dataset,
        apiVersion: "v2026-01-01",
        url: `${siteUrl}/api/revalidate`,
        on: ["create", "update", "delete"],
        filter: `!string::startsWith(_type, "sanity.") && !string::startsWith(_type, "system.")`,
        projection: `{
          _type,
          _id,
          "slug": slug,
          "metadata": { "slug": metadata.slug },
          "contentOnly": delta::operation() == "update" && delta::changedOnly((sections, body, showNotes, transcript))
        }`,
        httpMethod: "POST",
        secret: requireEnv("SANITY_REVALIDATE_SECRET"),
        status: "enabled",
      }),
    ]
  : [];

export default defineBlueprint({
  resources: [...corsOrigins, ...revalidateWebhook],
});
