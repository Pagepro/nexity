import { execFileSync } from "node:child_process";
import { mkdir, readFile, rm, rmdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

import { install } from "./tooling/distribution.mjs";
import { hash, readJson, skillClosure, stat, walk } from "./tooling/files.mjs";

const check = process.argv.includes("--check");
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
    dryRun: check,
  });
  console.info(
    `${starter}: ${result.changes.length} changed files, ${result.skills.length} skills`,
  );
  if (
    check &&
    (result.changes.length || result.links.some((link) => link.status !== "ok"))
  )
    process.exitCode = 1;
}

for (const [plugin, skills] of Object.entries(catalog.plugins ?? {})) {
  const included = skillClosure(
    { skills: { ...catalog.skills, ...catalog.rootOnly } },
    skills,
  );
  const missing = included.filter((name) => !skills.includes(name));
  if (missing.length)
    throw new Error(
      `Plugin ${plugin} needs these skills in catalog.json: ${missing.join(", ")}`,
    );
  const folder = `plugins/${plugin}/skills`;
  // Only files git would commit: a local build (node_modules, dist) must not reach the plugin.
  const tracked = execFileSync(
    "git",
    [
      "ls-files",
      "--cached",
      "--others",
      "--exclude-standard",
      "-z",
      "--",
      ...included.map((name) => `.agents/skills/${name}`),
    ],
    { cwd: source, encoding: "utf8" },
  )
    .split("\0")
    .filter(Boolean);
  const wanted = {};
  for (const file of tracked) {
    if (await stat(join(source, file)))
      wanted[file.replace(".agents/skills/", `${folder}/`)] = await readFile(
        join(source, file),
      );
  }
  const current = (await stat(join(source, folder))) ? await walk(source, folder) : {};
  const changes = [...new Set([...Object.keys(current), ...Object.keys(wanted)])]
    .sort()
    .filter(
      (file) =>
        !current[file] || !wanted[file] || hash(current[file]) !== hash(wanted[file]),
    );
  if (!check) {
    for (const file of changes) {
      const target = join(source, file);
      if (wanted[file]) {
        await mkdir(dirname(target), { recursive: true });
        await writeFile(target, wanted[file]);
      } else {
        await rm(target);
        for (
          let parent = dirname(target);
          parent.startsWith(join(source, folder));
          parent = dirname(parent)
        ) {
          try {
            await rmdir(parent);
          } catch {
            break;
          }
        }
      }
    }
  }
  console.info(`${plugin}: ${changes.length} changed files, ${included.length} skills`);
  if (check && changes.length) process.exitCode = 1;
}
