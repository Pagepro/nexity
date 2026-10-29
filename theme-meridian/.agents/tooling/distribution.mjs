import {
  mkdir,
  readFile,
  readlink,
  realpath,
  rm,
  rmdir,
  symlink,
  writeFile,
} from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";

import { hash, json, readJson, safePath, skillClosure, stat, walk } from "./files.mjs";

export const LOCK = ".agents/install-lock.json";

export async function readLock(project) {
  const path = await safePath(project, LOCK);
  if (!(await stat(path))) return null;
  const lock = await readJson(path);
  if (
    lock.schemaVersion !== 1 ||
    !Array.isArray(lock.selected) ||
    !lock.files ||
    !Array.isArray(lock.clients)
  ) {
    throw new Error("Unsupported or invalid agent install lock.");
  }
  if (
    typeof lock.source?.version !== "string" ||
    hash(json(lock.files)) !== lock.source.digest
  ) {
    throw new Error("Agent install lock digest mismatch.");
  }
  for (const [name, digest] of Object.entries(lock.files)) {
    if (
      !/^\.agents\/(skills\/|agents\/|tooling\/|catalog\.json$)/.test(name) ||
      !/^[a-f0-9]{64}$/.test(digest)
    ) {
      throw new Error("Invalid managed file in agent install lock.");
    }
    await safePath(project, name);
  }
  return lock;
}

export function clientLinks(clients) {
  const links = {};
  for (const client of clients) {
    if (client === "claude") {
      links[".claude/skills"] = ".agents/skills";
      links[".claude/agents"] = ".agents/agents";
    } else if (client === "cursor") {
      links[".cursor/skills"] = ".agents/skills";
    } else if (client !== "codex") {
      throw new Error(`Unknown client: ${client}. Use claude, cursor or codex.`);
    }
  }
  return links;
}

export async function inspectLinks(project, clients) {
  const results = [];
  for (const [name, target] of Object.entries(clientLinks(clients))) {
    await safePath(project, dirname(name));
    const path = join(project, name);
    const info = await stat(path);
    const matches =
      info?.isSymbolicLink() &&
      resolve(dirname(path), await readlink(path)) === join(project, target);
    results.push({
      name,
      target,
      status: !info ? "missing" : matches ? "ok" : "conflict",
    });
  }
  return results;
}

export async function install({ project, source, skills, clients, dryRun = false }) {
  project = await realpath(project);
  source = await realpath(source);
  const previous = await readLock(project);
  if (project === source && previous) {
    if (skills)
      throw new Error("Selecting additional skills requires --source <checkout>.");
    const requestedClients = clients ?? previous.clients;
    const links = await inspectLinks(project, requestedClients);
    if (links.some((link) => link.status === "conflict"))
      throw new Error(
        "Client adapter conflicts; nothing written. Move the existing adapter before installing.",
      );
    if (!dryRun) {
      await createLinks(project, links);
      await writeFile(
        join(project, LOCK),
        json({ ...previous, clients: requestedClients }),
      );
    }
    return {
      dryRun,
      source: previous.source,
      skills: previous.selected,
      changes: [],
      links,
    };
  }
  const catalog = await readJson(await safePath(source, ".agents/catalog.json"));
  if (typeof catalog.version !== "string" || !catalog.skills)
    throw new Error("Invalid agent catalog.");
  const defaults = [];
  for (const [name, spec] of Object.entries(catalog.skills)) {
    if (!spec.requires || (await stat(await safePath(project, spec.requires))))
      defaults.push(name);
  }
  const renamed = catalog.renamed ?? {};
  const kept = (previous?.selected ?? [])
    .map((name) => (Object.hasOwn(renamed, name) ? renamed[name] : name))
    .filter((name) => Object.hasOwn(catalog.skills, name));
  const selected = [
    ...new Set([...kept, ...(skills ?? (previous ? [] : defaults))]),
  ].sort();
  const included = skillClosure(catalog, selected);
  const files = {};
  const reviewers = new Set();
  for (const name of included) {
    const spec = catalog.skills[name];
    if (spec.requires && !(await stat(await safePath(project, spec.requires)))) {
      throw new Error(`Skill ${name} requires ${spec.requires} in the target project.`);
    }
    Object.assign(files, await walk(source, `.agents/skills/${name}`));
    if (!files[`.agents/skills/${name}/SKILL.md`])
      throw new Error(`Missing SKILL.md: ${name}`);
    for (const reviewer of spec.reviewers ?? []) reviewers.add(reviewer);
  }
  for (const reviewer of [...reviewers].sort()) {
    if (!/^[a-z0-9-]+$/.test(reviewer)) throw new Error("Invalid reviewer name.");
    Object.assign(files, await walk(source, `.agents/agents/${reviewer}.md`));
  }
  if (await stat(join(source, ".agents/tooling")))
    Object.assign(files, await walk(source, ".agents/tooling"));
  const installedCatalog = {
    version: catalog.version,
    skills: Object.fromEntries(included.map((name) => [name, catalog.skills[name]])),
  };
  files[".agents/catalog.json"] = Buffer.from(json(installedCatalog));
  const hashes = Object.fromEntries(
    Object.keys(files)
      .sort()
      .map((name) => [name, hash(files[name])]),
  );
  const requestedClients = [
    ...new Set(clients ?? previous?.clients ?? ["claude", "codex"]),
  ].sort();
  const links = await inspectLinks(project, requestedClients);
  const conflicts = links
    .filter((link) => link.status === "conflict")
    .map((link) => link.name);
  const changes = [];
  for (const name of [
    ...new Set([...Object.keys(previous?.files ?? {}), ...Object.keys(files)]),
  ].sort()) {
    const target = await safePath(project, name);
    const info = await stat(target);
    if (info && !info.isFile()) {
      conflicts.push(name);
      continue;
    }
    const current = info ? hash(await readFile(target)) : null;
    const before = previous?.files[name];
    const after = hashes[name];
    if (current === after) continue;
    if (before ? current !== before : current !== null) conflicts.push(name);
    else changes.push({ name, action: after ? "write" : "remove" });
  }
  if (conflicts.length)
    throw new Error(
      `Local changes or conflicting paths; nothing written:\n${conflicts.join("\n")}\nBack up and reconcile these files with the previous source before updating. No force overwrite is provided.`,
    );
  const lock = {
    schemaVersion: 1,
    source: { version: catalog.version, digest: hash(json(hashes)) },
    selected,
    clients: requestedClients,
    files: hashes,
  };
  if (!dryRun) {
    for (const change of changes) {
      const target = join(project, change.name);
      if (change.action === "remove") {
        await rm(target);
        // An uninstalled skill leaves no empty folder behind for an agent to list.
        for (
          let folder = dirname(target);
          folder.startsWith(join(project, ".agents/"));
          folder = dirname(folder)
        ) {
          try {
            await rmdir(folder);
          } catch {
            break;
          }
        }
      } else {
        await mkdir(dirname(target), { recursive: true });
        await writeFile(target, files[change.name]);
      }
    }
    await mkdir(join(project, ".agents/agents"), { recursive: true });
    await createLinks(project, links);
    await writeFile(join(project, LOCK), json(lock));
  }
  return { dryRun, source: lock.source, skills: included, changes, links };
}

async function createLinks(project, links) {
  for (const link of links.filter((item) => item.status === "missing")) {
    const path = join(project, link.name);
    const target = join(project, link.target);
    await mkdir(target, { recursive: true });
    await mkdir(dirname(path), { recursive: true });
    await symlink(
      process.platform === "win32" ? target : relative(dirname(path), target),
      path,
      process.platform === "win32" ? "junction" : "dir",
    );
  }
}
