// Deliberately minimal: a test that pulls in React or `next-sanity` must still
// fail, which keeps the serializers pure.
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const WEB_ROOT = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "../..");
const ALIAS_ROOTS = [path.join(WEB_ROOT, "src"), path.join(WEB_ROOT, "../studio/src")];
const CANDIDATE_SUFFIXES = ["", ".ts", ".tsx", "/index.ts", "/index.tsx"];

const isFile = (candidate) => existsSync(candidate) && statSync(candidate).isFile();

const findFile = (basePath) =>
  CANDIDATE_SUFFIXES.map((suffix) => `${basePath}${suffix}`).find(isFile);

export const resolve = async (specifier, context, nextResolve) => {
  if (specifier.startsWith("@/")) {
    const relativePath = specifier.slice(2);
    for (const root of ALIAS_ROOTS) {
      const match = findFile(path.join(root, relativePath));
      if (match) return { url: pathToFileURL(match).href, shortCircuit: true };
    }
  }

  const isRelative = specifier.startsWith("./") || specifier.startsWith("../");
  const fromTypeScript = /\.m?tsx?$/.test(context.parentURL ?? "");

  if (isRelative && fromTypeScript && !path.extname(specifier)) {
    const parentDirectory = path.dirname(fileURLToPath(context.parentURL));
    const match = findFile(path.resolve(parentDirectory, specifier));
    if (match) return { url: pathToFileURL(match).href, shortCircuit: true };
  }

  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    const isBareSubpath =
      !isRelative && !specifier.startsWith("node:") && specifier.includes("/");
    if (
      error?.code !== "ERR_MODULE_NOT_FOUND" ||
      !isBareSubpath ||
      path.extname(specifier)
    ) {
      throw error;
    }

    return nextResolve(`${specifier}.js`, context);
  }
};
