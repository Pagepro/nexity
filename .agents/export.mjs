import { resolve } from "node:path";

import { install } from "./tooling/distribution.mjs";
import { readJson, stat } from "./tooling/files.mjs";

const source = resolve(import.meta.dirname, "..");
const catalog = await readJson(resolve(source, ".agents/catalog.json"));
for (const starter of ["base", "theme-meridian"]) {
  const project = resolve(source, starter);
  const skills = [];
  for (const [name, spec] of Object.entries(catalog.skills)) {
    if (!spec.requires || (await stat(resolve(project, spec.requires))))
      skills.push(name);
  }
  const result = await install({
    project,
    source,
    skills,
    clients: ["claude", "codex"],
    dryRun: process.argv.includes("--check"),
  });
  console.info(
    `${starter}: ${result.changes.length} changed files, ${result.skills.length} skills`,
  );
  if (
    process.argv.includes("--check") &&
    (result.changes.length || result.links.some((link) => link.status !== "ok"))
  )
    process.exitCode = 1;
}
