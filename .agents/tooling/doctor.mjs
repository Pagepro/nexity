import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseEnv } from "node:util";

import { inspectLinks, readLock } from "./distribution.mjs";
import { hash, readJson, safePath, skillClosure, stat } from "./files.mjs";

async function environment(project, folder) {
  const values = {};
  for (const file of [
    ".env",
    ".env.development",
    ".env.local",
    ".env.development.local",
  ]) {
    const path = join(project, folder, file);
    if (await stat(path)) Object.assign(values, parseEnv(await readFile(path, "utf8")));
  }
  return { ...values, ...process.env };
}

async function runtimeChecks(url, add) {
  const target = new URL(url);
  if (
    !["localhost", "127.0.0.1", "[::1]"].includes(target.hostname) ||
    !["http:", "https:"].includes(target.protocol) ||
    target.username ||
    target.password ||
    target.search ||
    target.hash
  ) {
    throw new Error(
      "Doctor URL must be a loopback HTTP(S) URL without credentials, query or fragment.",
    );
  }
  try {
    const response = await fetch(target.origin, {
      signal: AbortSignal.timeout(2500),
      redirect: "manual",
    });
    await response.body?.cancel();
    add(
      "server",
      response.status < 400 ? "pass" : "warn",
      `Local server answered HTTP ${response.status}.`,
    );
  } catch {
    add(
      "server",
      "warn",
      "Local server unavailable. Start pnpm dev; use --url for another local port.",
    );
  }
  try {
    const response = await fetch(`${target.origin}/_next/mcp`, {
      method: "POST",
      signal: AbortSignal.timeout(2500),
      redirect: "error",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
    });
    const body = await response.text();
    const payload =
      body.startsWith("data:") || body.startsWith("event:")
        ? body
            .split("\n")
            .filter((line) => line.startsWith("data:"))
            .map((line) => JSON.parse(line.slice(5)))
            .find((event) => event.id === 1)
        : JSON.parse(body);
    const tools = payload?.result?.tools;
    const nextTools =
      Array.isArray(tools) &&
      tools.some((tool) => ["get_errors", "get_project_metadata"].includes(tool.name));
    add(
      "mcp:runtime",
      response.ok && nextTools ? "pass" : "warn",
      response.ok && nextTools
        ? "Next.js MCP tools/list answered with runtime tools."
        : "Next.js MCP runtime not confirmed. Start a Next.js 16+ dev server.",
    );
  } catch {
    add(
      "mcp:runtime",
      "warn",
      "Next.js MCP runtime not confirmed. Check the dev server and selected port.",
    );
  }
}

export async function doctor(project, { url = "http://localhost:3000" } = {}) {
  const checks = [];
  const add = (id, status, message) => checks.push({ id, status, message });
  const pkg = await readJson(join(project, "package.json"));
  const minimum = /^>=(\d+)\.(\d+)\.(\d+)$/.exec(pkg.engines?.node ?? "");
  const current = process.versions.node.split(".").map(Number);
  const required = minimum?.slice(1).map(Number);
  const comparison = required
    ? (current
        .map((part, index) => Math.sign(part - required[index]))
        .find((part) => part !== 0) ?? 0)
    : null;
  add(
    "node",
    comparison === null ? "warn" : comparison >= 0 ? "pass" : "fail",
    `Node ${process.versions.node}; project requirement ${pkg.engines?.node ?? "unspecified"}.`,
  );
  const expected = /^pnpm@([^+]+)/.exec(pkg.packageManager ?? "")?.[1];
  const pnpm = spawnSync(
    "pnpm",
    ["--version", "--manage-package-manager-versions=false"],
    {
      cwd: project,
      encoding: "utf8",
      timeout: 5000,
      env: {
        ...process.env,
        COREPACK_ENABLE_NETWORK: "0",
        COREPACK_ENABLE_AUTO_PIN: "0",
        COREPACK_DEFAULT_TO_LATEST: "0",
      },
    },
  );
  const version =
    pnpm.status === 0 && /^\d+\.\d+\.\d+$/.test(pnpm.stdout.trim())
      ? pnpm.stdout.trim()
      : null;
  add(
    "pnpm",
    version && version === expected ? "pass" : "fail",
    version
      ? `pnpm ${version}; expected ${expected ?? "packageManager field"}.`
      : "pnpm unavailable. Install the version in packageManager.",
  );
  for (const folder of ["node_modules", "web/node_modules", "studio/node_modules"]) {
    const installed = await stat(join(project, folder));
    add(
      `dependencies:${folder}`,
      installed ? "pass" : "fail",
      installed ? "Present." : "Missing; run pnpm install.",
    );
  }
  try {
    const web = await environment(project, "web");
    const studio = await environment(project, "studio");
    for (const [folder, env, names] of [
      ["web", web, ["NEXT_PUBLIC_SANITY_PROJECT_ID", "NEXT_PUBLIC_SANITY_DATASET"]],
      ["studio", studio, ["SANITY_STUDIO_PROJECT_ID", "SANITY_STUDIO_DATASET"]],
    ]) {
      for (const name of names)
        add(
          `env:${folder}:${name}`,
          env[name]?.trim() ? "pass" : "fail",
          env[name]?.trim()
            ? "Set (presence only; value hidden)."
            : "Missing or empty; configure the package environment.",
        );
    }
    for (const name of ["SANITY_API_READ_TOKEN", "SANITY_REVALIDATE_SECRET"]) {
      add(
        `env:web:${name}`,
        web[name]?.trim() ? "pass" : "warn",
        web[name]?.trim()
          ? "Set; not authenticated or validated."
          : "Recommended variable missing or empty.",
      );
    }
    const same =
      web.NEXT_PUBLIC_SANITY_PROJECT_ID &&
      web.NEXT_PUBLIC_SANITY_DATASET &&
      web.NEXT_PUBLIC_SANITY_PROJECT_ID === studio.SANITY_STUDIO_PROJECT_ID &&
      web.NEXT_PUBLIC_SANITY_DATASET === studio.SANITY_STUDIO_DATASET;
    add(
      "env:alignment",
      same ? "pass" : "fail",
      same
        ? "Web and Studio select the same project and dataset."
        : "Web and Studio project/dataset missing or mismatched; values hidden.",
    );
  } catch {
    add("env", "fail", "Cannot read or parse environment files; no contents printed.");
  }
  try {
    const lock = await readLock(project);
    if (!lock)
      add(
        "agents:installation",
        "fail",
        "Install lock missing; run agent:install with a trusted source.",
      );
    else {
      add(
        "agents:source",
        "pass",
        `Version ${lock.source.version}; content SHA-256 ${lock.source.digest}.`,
      );
      for (const [name, expectedHash] of Object.entries(lock.files)) {
        const path = await safePath(project, name);
        const info = await stat(path);
        if (!info?.isFile()) add(`agents:${name}`, "fail", "Managed file missing.");
        else if (hash(await readFile(path)) !== expectedHash)
          add(
            `agents:${name}`,
            "warn",
            "Locally modified; updates will preserve it or report a conflict.",
          );
      }
      const catalog = await readJson(join(project, ".agents/catalog.json"));
      for (const name of skillClosure(catalog, lock.selected)) {
        if (!(await stat(join(project, `.agents/skills/${name}/SKILL.md`))))
          add(`skill:${name}`, "fail", "Required skill missing.");
        for (const reviewer of catalog.skills[name].reviewers ?? []) {
          if (!(await stat(join(project, `.agents/agents/${reviewer}.md`))))
            add(`reviewer:${reviewer}`, "fail", "Required reviewer missing.");
        }
      }
      for (const link of await inspectLinks(project, lock.clients))
        add(
          `client:${link.name}`,
          link.status === "ok" ? "pass" : "warn",
          link.status === "ok"
            ? "Points to canonical .agents files."
            : `${link.status}; run agent:install to create missing links. Existing paths are never replaced.`,
        );
    }
  } catch {
    add(
      "agents:installation",
      "fail",
      "Cannot validate agent installation; inspect catalog and install-lock.json for invalid paths or structure.",
    );
  }
  const configured = new Set();
  for (const file of [".mcp.json", ".cursor/mcp.json", ".vscode/mcp.json"]) {
    if (!(await stat(join(project, file)))) continue;
    try {
      const config = await readJson(join(project, file));
      for (const entry of Object.values(config.mcpServers ?? config.servers ?? {})) {
        if (entry?.url === "https://mcp.sanity.io") configured.add("sanity");
        if (
          Array.isArray(entry?.args) &&
          entry.args.some(
            (arg) =>
              typeof arg === "string" && /^next-devtools-mcp(?:@[^\s]+)?$/.test(arg),
          )
        )
          configured.add("next-devtools");
      }
    } catch {
      add(
        `config:${file}`,
        "warn",
        "Could not parse project MCP JSON; no contents printed.",
      );
    }
  }
  for (const name of ["sanity", "next-devtools"])
    add(
      `mcp:config:${name}`,
      configured.has(name) ? "pass" : "warn",
      configured.has(name)
        ? "Project JSON configuration found; client loading/authentication not verified."
        : "Not found in project JSON configs. Global/client-specific configuration may exist; see docs/guides/agent-tools.md.",
    );
  add(
    "mcp:sanity-auth",
    "skip",
    "Sanity authentication must be checked in the agent client with a read-only project/schema query. Doctor does not access the remote CMS.",
  );
  await runtimeChecks(url, add);
  return { checks };
}
