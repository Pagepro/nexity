#!/usr/bin/env node
// Each rule comes from a measured performance regression; web/AGENTS.md →
// "Client Code & Performance" explains them.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src");

const IGNORED_DIRECTORIES = [
  path.join(SOURCE_ROOT, "app/(studio)"),
  path.join(SOURCE_ROOT, "app/(styleguide)"),
  path.join(SOURCE_ROOT, "ui/styleguide"),
];

const SERVER_ONLY_MODULES = [
  {
    match: (specifier, resolved) =>
      resolved === path.join(SOURCE_ROOT, "ui/RichText/index.tsx"),
    reason:
      "RichText ships Portable Text and every block renderer. Render it on the server and pass it in as a ReactNode.",
  },
  {
    match: (specifier) => specifier === "@portabletext/react",
    reason:
      "Portable Text renders on the server (RichText). Pass the result in as a ReactNode.",
  },
  {
    match: (specifier, resolved) =>
      resolved === path.join(SOURCE_ROOT, "ui/components/feature-icon.tsx"),
    reason:
      "FeatureIcon's map ships ~30 lucide icons. Import the icon you need, or render FeatureIcon on the server.",
  },
  {
    match: (specifier) => specifier === "@sanity/client",
    reason: "@sanity/client is server-only (urlFor is built from projectId + dataset).",
  },
];

const EXTENSIONS = [".tsx", ".ts", "/index.tsx", "/index.ts"];
const IMPORT_PATTERN =
  /(?:^|\n)\s*(?:import|export)\s+(?!type\b)(?:[^'"]*?\sfrom\s+)?["']([^"']+)["']/g;

const listSourceFiles = (directory) =>
  readdirSync(directory).flatMap((entry) => {
    const fullPath = path.join(directory, entry);

    if (IGNORED_DIRECTORIES.includes(fullPath)) return [];
    if (statSync(fullPath).isDirectory()) return listSourceFiles(fullPath);

    return /\.(tsx?|mts)$/.test(entry) ? [fullPath] : [];
  });

const resolveSpecifier = (specifier, fromFile) => {
  let base;

  if (specifier.startsWith("@/")) base = path.join(SOURCE_ROOT, specifier.slice(2));
  else if (specifier.startsWith("."))
    base = path.resolve(path.dirname(fromFile), specifier);
  else return null;

  if (existsSync(base) && statSync(base).isFile()) return base;

  for (const extension of EXTENSIONS) {
    if (existsSync(base + extension)) return base + extension;
  }

  return null;
};

const sourceCache = new Map();
const readSource = (file) => {
  if (!sourceCache.has(file)) sourceCache.set(file, readFileSync(file, "utf8"));

  return sourceCache.get(file);
};

const isClientFile = (file) =>
  /^\s*(?:\/\/[^\n]*\n\s*)*["']use client["']/.test(readSource(file));

const DYNAMIC_IMPORT_PATTERN = /\bimport\(\s*["']([^"']+)["']\s*\)/g;

const staticImports = (file) =>
  [...readSource(file).matchAll(IMPORT_PATTERN)].map((match) => match[1]);

const allImports = (file) => [
  ...staticImports(file),
  ...[...readSource(file).matchAll(DYNAMIC_IMPORT_PATTERN)].map((match) => match[1]),
];

// `next/dynamic` without `ssr: false` (client-lazy.tsx) is server-rendered, so its
// chunk loads before hydration; other import() calls really are deferred.
const firstLoadImports = (file) => {
  const source = readSource(file);
  const isSsrDynamic = source.includes("next/dynamic") && !/ssr:\s*false/.test(source);

  return isSsrDynamic ? allImports(file) : staticImports(file);
};

const relative = (file) => path.relative(path.resolve(SOURCE_ROOT, "../.."), file);

const problems = [];
const files = listSourceFiles(SOURCE_ROOT);

// A client file reached only through import() (draft-mode tools) is split out already.
const boundaries = new Set();
for (const file of files.filter((candidate) => !isClientFile(candidate))) {
  for (const specifier of staticImports(file)) {
    const resolved = resolveSpecifier(specifier, file);

    if (resolved && files.includes(resolved) && isClientFile(resolved))
      boundaries.add(resolved);
  }
}

for (const clientFile of boundaries) {
  const visited = new Set();
  const queue = [[clientFile, [clientFile]]];

  while (queue.length) {
    const [file, chain] = queue.shift();

    if (visited.has(file)) continue;
    visited.add(file);

    for (const specifier of allImports(file)) {
      const resolved = resolveSpecifier(specifier, file);
      const rule = SERVER_ONLY_MODULES.find((candidate) =>
        candidate.match(specifier, resolved),
      );

      if (rule) {
        problems.push(
          `${relative(clientFile)} reaches "${specifier}"\n    via ${[
            ...chain,
            resolved ?? specifier,
          ]
            .map((step) => (step.startsWith("/") ? relative(step) : step))
            .join(" → ")}\n    ${rule.reason}`,
        );
        continue;
      }

      if (
        resolved &&
        !IGNORED_DIRECTORIES.some((directory) => resolved.startsWith(directory))
      ) {
        queue.push([resolved, [...chain, resolved]]);
      }
    }
  }
}

const sectionsRoot = path.join(SOURCE_ROOT, "ui/sections");
for (const file of files.filter((candidate) => candidate.startsWith(sectionsRoot))) {
  if (isClientFile(file)) continue;

  for (const specifier of staticImports(file)) {
    if (specifier === "./client") {
      problems.push(
        `${relative(file)} imports "./client" directly.\n    Import it through ./client-lazy.tsx ("use client" + dynamic(() => import("./client"))), or every CMS page downloads it.`,
      );
    }
  }
}

const IMAGE_COMPONENT = path.join(SOURCE_ROOT, "ui/components/image/index.tsx");
const CN_MODULE = path.join(SOURCE_ROOT, "lib/utils.ts");
const STATIC_CLIENT_FORBIDDEN = new Map([
  [
    IMAGE_COMPONENT,
    "It ships the image URL builder and asset utils. Render <Img> on the server and pass it in as a ReactNode.",
  ],
  [
    CN_MODULE,
    "cn is tailwind-merge (~8 KB br, plus its class map built during hydration). Use clsx in client code; render ButtonLink and other cn users on the server and pass them in as ReactNode.",
  ],
]);
// Cards rendered from data fetched in the browser: the server can't pre-render their images.
const IMAGE_IN_CLIENT_ALLOWED = new Set(
  [
    "ui/sections/BlogListingSection/post-card.tsx",
    "ui/sections/CaseStudiesListingSection/case-study-card.tsx",
    "ui/sections/IntegrationsGrid/integration-tile.tsx",
  ].map((file) => path.join(SOURCE_ROOT, file)),
);
for (const clientFile of boundaries) {
  const visited = new Set();
  const queue = [[clientFile, [clientFile]]];

  while (queue.length) {
    const [file, chain] = queue.shift();

    if (visited.has(file)) continue;
    visited.add(file);

    for (const specifier of firstLoadImports(file)) {
      const resolved = resolveSpecifier(specifier, file);
      const isAllowed = resolved === IMAGE_COMPONENT && IMAGE_IN_CLIENT_ALLOWED.has(file);

      if (STATIC_CLIENT_FORBIDDEN.has(resolved) && file !== resolved && !isAllowed) {
        problems.push(
          `${relative(clientFile)} imports ${relative(resolved)} into client code\n    via ${[
            ...chain,
            resolved,
          ]
            .map((step) => relative(step))
            .join(" → ")}\n    ${STATIC_CLIENT_FORBIDDEN.get(resolved)}`,
        );
        continue;
      }

      if (
        resolved &&
        !IGNORED_DIRECTORIES.some((directory) => resolved.startsWith(directory))
      ) {
        queue.push([resolved, [...chain, resolved]]);
      }
    }
  }
}

const uniqueProblems = [...new Set(problems)];

if (uniqueProblems.length) {
  console.error(`Client boundary check failed (${uniqueProblems.length}):\n`);
  for (const problem of uniqueProblems) console.error(`- ${problem}\n`);
  console.error('See web/AGENTS.md → "Client Code & Performance".');
  process.exit(1);
}

console.info(`Client boundary check passed (${boundaries.size} client boundaries).`);
