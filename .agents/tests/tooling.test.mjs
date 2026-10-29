import assert from "node:assert/strict";
import { execFile, spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readdir, readFile, writeFile, rm, cp, symlink } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";

const cli = resolve(".agents/tooling/cli.mjs");
async function fixture(context) {
  const root = await mkdtemp(join(tmpdir(), "agent-tooling-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const source = join(root, "source");
  const project = join(root, "project");
  await mkdir(join(source, ".agents/skills/parent"), { recursive: true });
  await mkdir(join(source, ".agents/skills/child"), { recursive: true });
  await mkdir(join(source, ".agents/agents"), { recursive: true });
  await mkdir(project);
  await writeFile(
    join(project, "package.json"),
    JSON.stringify({ engines: { node: ">=22.12.0" }, packageManager: "pnpm@12.15.0" }),
  );
  await writeFile(
    join(source, ".agents/catalog.json"),
    JSON.stringify({
      version: "1.0.0",
      skills: { parent: { dependencies: ["child"], reviewers: ["reviewer"] }, child: {} },
    }),
  );
  await writeFile(join(source, ".agents/skills/parent/SKILL.md"), "parent v1");
  await writeFile(join(source, ".agents/skills/child/SKILL.md"), "child v1");
  await writeFile(join(source, ".agents/agents/reviewer.md"), "reviewer");
  return { source, project };
}
function run(project, ...args) {
  return spawnSync(process.execPath, [cli, ...args], { cwd: project, encoding: "utf8" });
}

test("installs dependencies and reviewers, updates clean files, preserves local edits", async (context) => {
  const { source, project } = await fixture(context);
  const install = run(project, "install", "--source", source, "--skills", "parent");
  assert.equal(install.status, 0, install.stderr);
  assert.equal(
    await readFile(join(project, ".agents/skills/child/SKILL.md"), "utf8"),
    "child v1",
  );
  assert.equal(
    await readFile(join(project, ".claude/agents/reviewer.md"), "utf8"),
    "reviewer",
  );
  const lock = JSON.parse(
    await readFile(join(project, ".agents/install-lock.json"), "utf8"),
  );
  assert.equal(lock.source.version, "1.0.0");
  assert.match(lock.source.digest, /^[a-f0-9]{64}$/);
  await writeFile(join(source, ".agents/skills/parent/SKILL.md"), "parent v2");
  assert.equal(run(project, "update", "--source", source).status, 0);
  assert.equal(
    await readFile(join(project, ".agents/skills/parent/SKILL.md"), "utf8"),
    "parent v2",
  );
  await writeFile(join(project, ".agents/skills/child/SKILL.md"), "local customization");
  await writeFile(join(source, ".agents/skills/parent/SKILL.md"), "parent v3");
  const conflict = run(project, "update", "--source", source);
  assert.notEqual(conflict.status, 0);
  assert.match(conflict.stderr, /child\/SKILL.md/);
  assert.equal(
    await readFile(join(project, ".agents/skills/parent/SKILL.md"), "utf8"),
    "parent v2",
  );
  assert.equal(
    await readFile(join(project, ".agents/skills/child/SKILL.md"), "utf8"),
    "local customization",
  );
});

test("doctor reports missing requirements without exposing environment values", async (context) => {
  const { project } = await fixture(context);
  await mkdir(join(project, "web"));
  await writeFile(
    join(project, "web/.env.local"),
    "SANITY_API_READ_TOKEN=never-print-this-secret\nNEXT_PUBLIC_SANITY_PROJECT_ID=private-project\n",
  );
  const result = run(project, "doctor", "--json");
  assert.equal(result.status, 1);
  const report = JSON.parse(result.stdout);
  assert.ok(
    report.checks.some(
      (check) =>
        check.id === "env:web:NEXT_PUBLIC_SANITY_DATASET" && check.status === "fail",
    ),
  );
  assert.ok(!result.stdout.includes("never-print-this-secret"));
  assert.ok(!result.stdout.includes("private-project"));
});

test("doctor distinguishes configured MCP, a generic web server and runtime tools", async (context) => {
  const { project } = await fixture(context);
  await writeFile(
    join(project, ".mcp.json"),
    JSON.stringify({
      mcpServers: {
        sanity: {
          url: "https://mcp.sanity.io",
          headers: { Authorization: "secret-never-in-report" },
        },
        next: { command: "pnpm", args: ["dlx", "next-devtools-mcp@latest"] },
      },
    }),
  );
  let runtime = false;
  const server = createServer((request, response) => {
    response.setHeader("Content-Type", "application/json");
    response.end(
      runtime && request.url === "/_next/mcp"
        ? JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            result: { tools: [{ name: "get_errors" }] },
          })
        : JSON.stringify({ ok: true }),
    );
  });
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  context.after(
    () =>
      new Promise((done) => {
        server.close(done);
        server.closeAllConnections();
      }),
  );
  const inspect = async () => {
    const result = await promisify(execFile)(
      process.execPath,
      [cli, "doctor", "--json", "--url", `http://127.0.0.1:${server.address().port}`],
      { cwd: project },
    ).catch((error) => error);
    assert.ok(!result.stdout.includes("secret-never-in-report"));
    return JSON.parse(result.stdout).checks;
  };
  const generic = await inspect();
  assert.equal(generic.find((check) => check.id === "server").status, "pass");
  assert.equal(generic.find((check) => check.id === "mcp:runtime").status, "warn");
  assert.equal(generic.find((check) => check.id === "mcp:config:sanity").status, "pass");
  assert.equal(generic.find((check) => check.id === "mcp:sanity-auth").status, "skip");
  runtime = true;
  assert.equal(
    (await inspect()).find((check) => check.id === "mcp:runtime").status,
    "pass",
  );
});

test("dry run writes nothing and client adapters never replace existing folders", async (context) => {
  const { project, source } = await fixture(context);
  assert.equal(run(project, "install", "--source", source, "--dry-run").status, 0);
  await assert.rejects(readFile(join(project, ".agents/install-lock.json")), {
    code: "ENOENT",
  });
  await mkdir(join(project, ".claude/skills"), { recursive: true });
  await writeFile(join(project, ".claude/skills/custom.md"), "custom");
  const result = run(project, "install", "--source", source);
  assert.notEqual(result.status, 0);
  await assert.rejects(readFile(join(project, ".agents/install-lock.json")), {
    code: "ENOENT",
  });
  assert.equal(
    await readFile(join(project, ".claude/skills/custom.md"), "utf8"),
    "custom",
  );
});

test("refuses symlink escapes and invalid dependencies before writing", async (context) => {
  const { project, source } = await fixture(context);
  await symlink(join(source, ".agents"), join(project, ".agents"), "dir");
  assert.notEqual(run(project, "install", "--source", source).status, 0);
  await rm(join(project, ".agents"));
  await writeFile(
    join(source, ".agents/catalog.json"),
    JSON.stringify({ version: "1", skills: { parent: { dependencies: ["missing"] } } }),
  );
  assert.match(run(project, "install", "--source", source).stderr, /Unknown skill/);
  await assert.rejects(readFile(join(project, ".agents/install-lock.json")), {
    code: "ENOENT",
  });
});

test("repairs adapters without accepting local edits as the upstream baseline", async (context) => {
  const { project, source } = await fixture(context);
  assert.equal(run(project, "install", "--source", source).status, 0);
  await writeFile(join(project, ".agents/skills/child/SKILL.md"), "custom");
  const before = await readFile(join(project, ".agents/install-lock.json"), "utf8");
  await rm(join(project, ".claude/skills"));
  assert.equal(run(project, "install").status, 0);
  assert.equal(
    await readFile(join(project, ".agents/install-lock.json"), "utf8"),
    before,
  );
  assert.equal(
    await readFile(join(project, ".claude/skills/child/SKILL.md"), "utf8"),
    "custom",
  );
  assert.notEqual(run(project, "update", "--source", source).status, 0);
});

test("removes unchanged upstream files but preserves user-created files", async (context) => {
  const { project, source } = await fixture(context);
  await writeFile(join(source, ".agents/skills/child/old.md"), "old");
  assert.equal(run(project, "install", "--source", source).status, 0);
  await writeFile(join(project, ".agents/skills/child/custom.md"), "mine");
  await rm(join(source, ".agents/skills/child/old.md"));
  assert.equal(run(project, "update", "--source", source).status, 0);
  await assert.rejects(readFile(join(project, ".agents/skills/child/old.md")), {
    code: "ENOENT",
  });
  assert.equal(
    await readFile(join(project, ".agents/skills/child/custom.md"), "utf8"),
    "mine",
  );
});

test("update follows renamed skills and uninstalls skills dropped from the catalog", async (context) => {
  const { project, source } = await fixture(context);
  await mkdir(join(source, ".agents/skills/solo"), { recursive: true });
  await writeFile(join(source, ".agents/skills/solo/SKILL.md"), "solo");
  await writeFile(
    join(source, ".agents/catalog.json"),
    JSON.stringify({
      version: "1.0.0",
      skills: { parent: { dependencies: ["child"] }, child: {}, solo: {} },
    }),
  );
  assert.equal(run(project, "install", "--source", source).status, 0);
  await cp(
    join(source, ".agents/skills/parent"),
    join(source, ".agents/skills/renamed"),
    { recursive: true },
  );
  await rm(join(source, ".agents/skills/parent"), { recursive: true });
  await rm(join(source, ".agents/skills/solo"), { recursive: true });
  await writeFile(
    join(source, ".agents/catalog.json"),
    JSON.stringify({
      version: "1.1.0",
      renamed: { parent: "renamed" },
      skills: { renamed: { dependencies: ["child"] }, child: {} },
    }),
  );
  const update = run(project, "update", "--source", source);
  assert.equal(update.status, 0, update.stderr);
  const lock = JSON.parse(
    await readFile(join(project, ".agents/install-lock.json"), "utf8"),
  );
  assert.deepEqual(lock.selected, ["child", "renamed"]);
  assert.equal(
    await readFile(join(project, ".agents/skills/renamed/SKILL.md"), "utf8"),
    "parent v1",
  );
  for (const gone of ["parent", "solo"])
    await assert.rejects(readdir(join(project, `.agents/skills/${gone}`)), {
      code: "ENOENT",
    });
});

test("both exported starters work without a parent checkout", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "agent-export-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  for (const starter of ["base", "theme-meridian"]) {
    const project = join(root, starter);
    await mkdir(project);
    await cp(resolve(starter, ".agents"), join(project, ".agents"), { recursive: true });
    await cp(resolve(starter, "package.json"), join(project, "package.json"));
    const result = spawnSync(process.execPath, [".agents/tooling/cli.mjs", "install"], {
      cwd: project,
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    assert.ok(
      (
        await readFile(join(project, ".claude/skills/create-section/SKILL.md"), "utf8")
      ).includes("create-section"),
    );
    const check = spawnSync(
      process.execPath,
      [".agents/tooling/cli.mjs", "doctor", "--json"],
      {
        cwd: project,
        encoding: "utf8",
      },
    );
    const report = JSON.parse(check.stdout);
    assert.ok(
      !report.checks.some(
        (item) => item.id.startsWith("agents:") && item.status !== "pass",
      ),
      check.stdout,
    );
  }
});
