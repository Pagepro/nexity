// Tests for ../build.py, run with: node --test .agents/skills/*/scripts/*.test.mjs
// Node built-ins only. They drive the Python script as a person would, on the example data.
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const skill = join(dirname(fileURLToPath(import.meta.url)), "..");
const hasPython = spawnSync("python3", ["--version"]).status === 0;

const BRAND = "# Brand\n\nExample.\n\n**Open decisions**\n\n- C1. Customer count: 200+ or 2,400+.\n";

function run(change, brand = BRAND, flags = []) {
  const dir = mkdtempSync(join(tmpdir(), "brand-kit-"));
  cpSync(join(skill, "kit.example.json"), join(dir, "kit.json"));
  if (change) {
    const kit = JSON.parse(readFileSync(join(dir, "kit.json"), "utf8"));
    change(kit);
    writeFileSync(join(dir, "kit.json"), JSON.stringify(kit));
  }
  writeFileSync(join(dir, "BRAND.md"), brand);
  const result = spawnSync("python3", [join(skill, "build.py"), dir, ...flags], { encoding: "utf8" });
  return { dir, status: result.status, out: result.stdout + result.stderr };
}

test("the example data builds all four files", { skip: !hasPython }, () => {
  const { dir, status, out } = run();
  assert.equal(status, 0, out);
  for (const file of ["evidence.md", "claims.md", "gap-questionnaire.md", "brand-kit.html"]) {
    assert.ok(existsSync(join(dir, file)), `${file} was not written`);
  }
  const html = readFileSync(join(dir, "brand-kit.html"), "utf8");
  assert.ok(!html.includes("{{"), "a token is left in the report");
  assert.ok(!html.includes("SLOT:"), "a slot is left in the report");
  const ids = new Set([...html.matchAll(/id="(e-?v?\d+)"/g)].map((m) => m[1]));
  for (const [, target] of html.matchAll(/href="#(e-?v?\d+)"/g)) {
    assert.ok(ids.has(target), `fact link to #${target} has no row`);
  }
  assert.match(readFileSync(join(dir, "evidence.md"), "utf8"), /\| e1 · /);
});

test("--check writes nothing", { skip: !hasPython }, () => {
  const { dir, status } = run(null, BRAND, ["--check"]);
  assert.equal(status, 0);
  assert.ok(!existsSync(join(dir, "brand-kit.html")));
});

test("a proof line that cites an unverified fact is refused", { skip: !hasPython }, () => {
  const { dir, status, out } = run((kit) => kit.proof.push("{uptime|99.99% uptime}."));
  assert.equal(status, 1);
  assert.match(out, /not usable as proof/);
  assert.ok(!existsSync(join(dir, "brand-kit.html")), "nothing is written when a check fails");
});

test("a question with two question marks is refused", { skip: !hasPython }, () => {
  const { status, out } = run((kit) => (kit.questions[0].question += " And since when?"));
  assert.equal(status, 1);
  assert.match(out, /exactly one question mark/);
});

test("a link to a missing evidence key is refused", { skip: !hasPython }, () => {
  const { status, out } = run((kit) => (kit.one_liner = "{nope|Acme}"));
  assert.equal(status, 1);
  assert.match(out, /no evidence row with key 'nope'/);
});

test("BRAND.md must list every conflict and hold no placeholder", { skip: !hasPython }, () => {
  const { status, out } = run(null, "# Brand\n\n<one sentence>\n");
  assert.equal(status, 1);
  assert.match(out, /leave out conflict/);
  assert.match(out, /placeholder/);
});
