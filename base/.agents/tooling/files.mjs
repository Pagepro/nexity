import { createHash } from "node:crypto";
import { lstat, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

export const hash = (value) => createHash("sha256").update(value).digest("hex");
export const json = (value) => `${JSON.stringify(value, null, 2)}\n`;

export async function stat(path) {
  try {
    return await lstat(path);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

export async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

export async function safePath(root, relative) {
  const parts = relative.split("/");
  if (
    parts.some(
      (part) =>
        !part ||
        part === "." ||
        part === ".." ||
        part.includes("\\") ||
        part.includes(":"),
    )
  ) {
    throw new Error(`Invalid managed path: ${relative}`);
  }
  let current = root;
  for (const part of parts) {
    current = join(current, part);
    if ((await stat(current))?.isSymbolicLink()) {
      throw new Error(`Refusing symlink in managed path: ${relative}`);
    }
  }
  return current;
}

export async function walk(root, relative) {
  const path = await safePath(root, relative);
  const info = await stat(path);
  if (!info) throw new Error(`Missing source: ${relative}`);
  if (info.isFile()) return { [relative]: await readFile(path) };
  if (!info.isDirectory())
    throw new Error(`Not a regular file or directory: ${relative}`);
  const files = {};
  for (const entry of (await readdir(path)).sort()) {
    Object.assign(files, await walk(root, `${relative}/${entry}`));
  }
  return files;
}

export function skillClosure(catalog, selected) {
  const visited = new Set();
  const visiting = new Set();
  const visit = (name) => {
    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) ||
      !Object.hasOwn(catalog.skills, name)
    ) {
      throw new Error(`Unknown skill: ${name}`);
    }
    if (visiting.has(name)) throw new Error(`Dependency cycle: ${name}`);
    if (visited.has(name)) return;
    visiting.add(name);
    for (const dependency of catalog.skills[name].dependencies ?? []) visit(dependency);
    visiting.delete(name);
    visited.add(name);
  };
  selected.forEach(visit);
  return [...visited].sort();
}
