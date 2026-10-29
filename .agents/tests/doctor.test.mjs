import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, join, resolve } from "node:path";
import { test } from "node:test";

const cli = resolve(".agents/tooling/cli.mjs");

test("doctor prevents version probes from provisioning package managers", async (context) => {
  const project = await mkdtemp(join(tmpdir(), "agent-doctor-"));
  context.after(() => rm(project, { recursive: true, force: true }));
  const bin = join(project, "bin");
  const marker = join(project, "provisioned");
  await mkdir(bin);
  await writeFile(
    join(project, "package.json"),
    JSON.stringify({ engines: { node: ">=22.12.0" }, packageManager: "pnpm@12.15.0" }),
  );
  await writeFile(
    join(bin, "pnpm"),
    `#!${process.execPath}
import { writeFileSync } from "node:fs";
const guarded = process.argv.includes("--manage-package-manager-versions=false") &&
  process.env.COREPACK_ENABLE_NETWORK === "0" &&
  process.env.COREPACK_ENABLE_AUTO_PIN === "0" &&
  process.env.COREPACK_DEFAULT_TO_LATEST === "0";
if (!guarded) writeFileSync(process.env.PROBE_MARKER, "provisioned");
if (guarded && process.env.PROBE_UNCACHED === "1") process.exit(1);
console.log("12.15.0");
`,
    { mode: 0o755 },
  );
  for (const uncached of ["0", "1"]) {
    const result = spawnSync(
      process.execPath,
      [cli, "doctor", "--json", "--url", "http://127.0.0.1:1"],
      {
        cwd: project,
        encoding: "utf8",
        env: {
          ...process.env,
          PATH: `${bin}${delimiter}${process.env.PATH ?? ""}`,
          COREPACK_ENABLE_NETWORK: "1",
          COREPACK_ENABLE_AUTO_PIN: "1",
          COREPACK_DEFAULT_TO_LATEST: "1",
          PROBE_MARKER: marker,
          PROBE_UNCACHED: uncached,
        },
      },
    );
    assert.equal(result.status, 1, result.stderr);
    const report = JSON.parse(result.stdout);
    assert.equal(
      report.checks.find((check) => check.id === "pnpm").status,
      uncached === "1" ? "fail" : "pass",
      result.stdout,
    );
    await assert.rejects(readFile(marker), { code: "ENOENT" });
  }
});
