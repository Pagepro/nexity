// oxlint-disable no-console
// Usage (with the project's `pnpm dev` running):
//   node capture.mjs --project=path/to/project
//   node capture.mjs --project=path/to/project --only=hero,faq
//   node capture.mjs --project=. --base=http://localhost:3001
//   node capture.mjs --project=. --report        # coverage only, no capture
//
// Flags:
//   --project=DIR     Project root holding web/ and studio/ (default: cwd)
//   --base=URL        Web app to photograph (default: http://localhost:3000)
//   --only=a,b        Capture these section types only
//   --chrome=PATH     Chrome/headless-shell binary (default: auto-detect)
//   --proxy=URL       --proxy-server for Chrome, for a sandboxed network
//   --width=N         Viewport width of the capture (default 1440)
//   --report          Report tile coverage and exit, capturing nothing
//   --verbose         Print Chrome's stderr

import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

import {
  TILE,
  TYPES_AWAITING_A_TILE,
  TYPES_WITHOUT_A_TILE,
  galleryPath,
  missingThumbnails,
  orphanThumbnails,
  sectionTypesFromSchemaSource,
  tilePlan,
} from "./lib.mjs";

const DEFAULT_BASE = "http://localhost:3000";
const DEBUG_PORT = 9333;

const flags = Object.fromEntries(
  process.argv.slice(2).map((argument) => {
    const [name, value = "true"] = argument.replace(/^--/, "").split("=");
    return [name, value];
  }),
);
const projectDir = path.resolve(flags.project || process.cwd());
const SCHEMA_SECTIONS = path.join(
  projectDir,
  "studio/src/sanity/schemaTypes/fragments/sections.ts",
);
const THUMBNAILS_DIR = path.join(projectDir, "web/public/admin/thumbnails");
if (!existsSync(SCHEMA_SECTIONS)) {
  console.error(
    `${SCHEMA_SECTIONS} not found. Pass --project=<dir with web/ and studio/>, e.g. --project=..`,
  );
  process.exit(1);
}
const base = (flags.base || DEFAULT_BASE).replace(/\/$/, "");
const only = flags.only ? flags.only.split(",").map((type) => type.trim()) : [];
const viewportWidth = Number(flags.width || 1440);
const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

// Prefer Playwright's chrome-headless-shell: full Chrome starts a ProcessSingleton and a
// Mach-port rendezvous server, a sandboxed shell denies both, and it exits before opening the port.
function findChrome() {
  const explicit = [flags.chrome, process.env.CHROME_BIN].find(
    (candidate) => candidate && existsSync(candidate),
  );
  if (explicit) return explicit;

  const shell = playwrightHeadlessShell();
  if (shell) return shell;

  const installed = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ].find((candidate) => existsSync(candidate));
  if (installed) return installed;

  throw new Error(
    "No Chrome found. Pass --chrome=/path/to/chrome (a Playwright chrome-headless-shell works).",
  );
}

function playwrightHeadlessShell() {
  const cache = path.join(homedir(), "Library/Caches/ms-playwright");
  if (!existsSync(cache)) return null;
  for (const entry of readdirSync(cache)) {
    if (!entry.startsWith("chromium_headless_shell")) continue;
    for (const platform of readdirSync(path.join(cache, entry))) {
      const binary = path.join(cache, entry, platform, "chrome-headless-shell");
      if (existsSync(binary)) return binary;
    }
  }
  return null;
}

class Chrome {
  #socket;
  #nextId = 1;
  #pending = new Map();
  #listeners = [];
  #process;
  sessionId;

  static async launch(binary) {
    const chrome = new Chrome();
    await chrome.#start(binary);
    return chrome;
  }

  async #start(binary) {
    this.#process = spawn(
      binary,
      [
        "--headless=new",
        // A single process avoids the Mach-port rendezvous the macOS sandbox
        // denies; a multi-process launch dies before it opens the port.
        "--single-process",
        "--no-zygote",
        "--disable-crashpad",
        "--disable-breakpad",
        "--disable-gpu",
        "--hide-scrollbars",
        "--force-color-profile=srgb",
        "--no-first-run",
        "--no-default-browser-check",
        `--remote-debugging-port=${DEBUG_PORT}`,
        `--user-data-dir=${path.join(process.env.TMPDIR || "/tmp", "sanity-module-catalog-profile")}`,
        ...(flags.proxy ? [`--proxy-server=${flags.proxy}`] : []),
        "about:blank",
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    this.#process.stderr.on(
      "data",
      (chunk) => flags.verbose && console.error(String(chunk)),
    );

    let webSocketUrl;
    for (let attempt = 0; attempt < 60 && !webSocketUrl; attempt++) {
      try {
        const response = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
        webSocketUrl = (await response.json()).webSocketDebuggerUrl;
      } catch {
        await sleep(250);
      }
    }
    if (!webSocketUrl) throw new Error("Chrome did not open its debugging port");

    this.#socket = new WebSocket(webSocketUrl);
    await new Promise((resolve, reject) => {
      this.#socket.onopen = resolve;
      this.#socket.onerror = reject;
    });
    this.#socket.onmessage = (event) => this.#receive(JSON.parse(event.data));

    const { targetId } = await this.send("Target.createTarget", { url: "about:blank" });
    const attached = await this.send("Target.attachToTarget", {
      targetId,
      flatten: true,
    });
    this.sessionId = attached.sessionId;
    await this.send("Page.enable");
    await this.send("Runtime.enable");
    await this.send("Emulation.setDeviceMetricsOverride", {
      width: viewportWidth,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });
  }

  #receive(message) {
    const waiting = message.id && this.#pending.get(message.id);
    if (waiting) {
      this.#pending.delete(message.id);
      if (message.error) waiting.reject(new Error(JSON.stringify(message.error)));
      else waiting.resolve(message.result);
      return;
    }
    for (const listener of this.#listeners) listener(message);
  }

  send(method, params = {}) {
    const id = this.#nextId++;
    this.#socket.send(JSON.stringify({ id, method, params, sessionId: this.sessionId }));
    return new Promise((resolve, reject) => this.#pending.set(id, { resolve, reject }));
  }

  waitFor(method, timeout = 60_000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        remove();
        reject(new Error(`timeout waiting for ${method}`));
      }, timeout);
      const listener = (message) => {
        if (message.method !== method) return;
        remove();
        resolve(message.params);
      };
      const remove = () => {
        clearTimeout(timer);
        const index = this.#listeners.indexOf(listener);
        if (index >= 0) this.#listeners.splice(index, 1);
      };
      this.#listeners.push(listener);
    });
  }

  async evaluate(expression) {
    const result = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails) {
      throw new Error(
        result.exceptionDetails.exception?.description || "evaluate failed",
      );
    }
    return result.result.value;
  }

  close() {
    this.#socket?.close();
    this.#process?.kill();
  }
}

// next/image keeps its blur placeholder until its own load event, so wait for every visible
// image to paint. Hidden images are skipped: a hidden responsive twin stays lazy for ever.
async function openPage(chrome, url) {
  const load = chrome.waitFor("Page.loadEventFired", 45_000);
  await chrome.send("Page.navigate", { url });
  try {
    await load;
  } catch (error) {
    console.warn(`  ${error.message} — continuing`);
  }
  await sleep(2000);

  await chrome.evaluate(`(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    window.scrollTo(0, 0);
    await new Promise((resolve) => setTimeout(resolve, 400));
  })()`);

  for (let attempt = 0; attempt < 45; attempt++) {
    const pending = await chrome.evaluate(`Array.from(document.images)
      .filter((image) => {
        if (image.complete && image.naturalWidth > 0) return false;
        const box = image.getBoundingClientRect();
        return box.width > 1 && box.height > 1;
      }).length`);
    if (pending === 0) break;
    if (attempt % 10 === 0) console.log(`  waiting on ${pending} images`);
    await sleep(1000);
  }

  // `next dev` draws its dev-tools badge in <nextjs-portal>; it would land in the tile.
  await chrome.evaluate(`(() => {
    const style = document.createElement("style");
    style.textContent =
      "*,*::before,*::after{animation-play-state:paused !important;transition:none !important}" +
      "nextjs-portal{display:none !important}";
    document.head.appendChild(style);
  })()`);
  await sleep(800);
}

// `data-section` comes from web/src/lib/sectionProps.ts.
function readSection(chrome, type) {
  return chrome.evaluate(`(() => {
    const node = document.querySelector(${JSON.stringify(`[data-section="${type}"]`)});
    if (!node) return null;
    const box = node.getBoundingClientRect();
    return {
      x: Math.round(box.x + window.scrollX),
      y: Math.round(box.y + window.scrollY),
      width: Math.round(box.width),
      height: Math.round(box.height),
    };
  })()`);
}

async function screenshot(chrome, clip, scale) {
  const { data } = await chrome.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    clip: { ...clip, scale },
  });
  return data;
}

async function toTileWebp(chrome, pngBase64, drawHeight) {
  const dataUrl = await chrome.evaluate(`(async () => {
    const image = new Image();
    image.src = "data:image/png;base64,${pngBase64}";
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = ${TILE.width};
    canvas.height = ${TILE.height};
    const context = canvas.getContext("2d");
    const probe = document.createElement("canvas");
    probe.width = probe.height = 1;
    const probeContext = probe.getContext("2d");
    probeContext.drawImage(image, 4, 4, 1, 1, 0, 0, 1, 1);
    const [red, green, blue] = probeContext.getImageData(0, 0, 1, 1).data;
    context.fillStyle = "rgb(" + red + "," + green + "," + blue + ")";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(
      image, 0, Math.round((${TILE.height} - ${drawHeight}) / 2), ${TILE.width}, ${drawHeight},
    );
    return canvas.toDataURL("image/webp", 0.82);
  })()`);
  return Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64");
}

async function reportCoverage(allTypes) {
  const files = existsSync(THUMBNAILS_DIR) ? await readdir(THUMBNAILS_DIR) : [];
  const missing = missingThumbnails(allTypes, files);
  const orphans = orphanThumbnails(allTypes, files);
  // Count only exemptions IN this list: `shared-section-ref` is in SECTIONS, not INNER_SECTIONS.
  const exempt = allTypes.filter((type) => type in TYPES_WITHOUT_A_TILE);
  const expected = allTypes.length - exempt.length;
  console.log(`\n${expected - missing.length} of ${expected} section types have a tile`);
  for (const [type, reason] of Object.entries(TYPES_WITHOUT_A_TILE)) {
    console.log(`  - ${type}: no tile by design (${reason})`);
  }
  // Outstanding tiles still fail this run: `missingThumbnails` exempts them only so `pnpm test` passes.
  const awaiting = allTypes.filter(
    (type) => type in TYPES_AWAITING_A_TILE && !files.includes(`${type}.webp`),
  );
  for (const type of awaiting) {
    console.log(`  OUTSTANDING ${type}: ${TYPES_AWAITING_A_TILE[type]}`);
  }
  if (missing.length) {
    console.log(`  MISSING (the insert menu shows a blank tile): ${missing.join(", ")}`);
    console.log(
      "  Add a gallery-fixture.ts for it (docs/agents/new-section.md), then re-run with --only=<type>.",
    );
  }
  if (orphans.length) {
    console.log(`  ORPHANED (no section type claims these): ${orphans.join(", ")}`);
  }
  return { missing: [...missing, ...awaiting], orphans };
}

async function main() {
  const allTypes = sectionTypesFromSchemaSource(await readFile(SCHEMA_SECTIONS, "utf8"));

  if ("report" in flags) {
    const { missing } = await reportCoverage(allTypes);
    process.exitCode = missing.length ? 1 : 0;
    return;
  }

  const unknown = only.filter((type) => !allTypes.includes(type));
  if (unknown.length) throw new Error(`Not a section type: ${unknown.join(", ")}`);
  const types = (only.length ? only : allTypes).filter(
    (type) => !(type in TYPES_WITHOUT_A_TILE),
  );

  await mkdir(THUMBNAILS_DIR, { recursive: true });

  const chrome = await Chrome.launch(findChrome());
  const captured = [];
  const failed = [];
  try {
    for (const type of types) {
      const url = `${base}${galleryPath(type)}`;
      console.log(`\n${url}`);
      await openPage(chrome, url);
      const section = await readSection(chrome, type);
      // No gallery fixture yet, or the fixture threw and the gallery drew its error card.
      if (!section || section.width < 8 || section.height < 8) {
        console.log(`  no rendered ${type} on the page — skipped`);
        failed.push(type);
        continue;
      }

      const plan = tilePlan(section);
      const tilePng = await screenshot(
        chrome,
        { x: section.x, y: section.y, width: section.width, height: plan.cropHeight },
        plan.scale,
      );
      await writeFile(
        path.join(THUMBNAILS_DIR, `${type}.webp`),
        await toTileWebp(chrome, tilePng, plan.drawHeight),
      );
      captured.push(type);
      console.log(
        `  ${type}  ${section.width}x${section.height}  tile ${plan.cropped ? "cropped" : "padded"}`,
      );
    }
  } finally {
    chrome.close();
  }

  if (failed.length) console.log(`\nnot captured: ${failed.join(", ")}`);
  console.log(`\ncaptured ${captured.length} tiles from ${base}`);
  const { missing } = await reportCoverage(allTypes);
  process.exitCode = missing.length || failed.length ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
