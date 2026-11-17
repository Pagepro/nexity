// The images a run needs, rendered from the fenced `visual` blocks in visual-plan.md: a
// `screenshot` of a live page, or an `html` page written for the run (a diagram, a checklist).
// Drives a Chrome or Edge already installed, over the DevTools protocol with Node's own
// WebSocket (Node 22+): no browser download, no packages. Every image stays a draft until a
// person has looked at it and uploaded it to the CMS.
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
export const DEFAULT_LANG = "en-US";
// A capture that shows a gate (bot check, block page, login wall) fails; it is never retried
// around the check: a person captures that page in a normal browser.
export const BLOCKED_PAGE =
  /access denied|you don't have permission to access|verify (that )?you are (a )?human|quick verification|press (&|and) hold|are you a robot|captcha|just a moment\.\.\.|attention required|request blocked|unusual traffic/i;
export const REJECT_BUTTON =
  /^(reject all( cookies)?|decline all( cookies)?|reject( cookies)?|decline|only necessary|necessary only|use necessary cookies only|refuse all|deny all|odrzuć wszystk(o|ie)|odrzuć)$/i;
export const BLOCKED_MARKUP = /px-captcha|perimeterx|challenge-platform|cf-chl-|_incapsula_|captcha-delivery|geo\.captcha/i;
export const PROMPT_TEXT = /cookie|consent|privacy settings|your location|lokalizacj|(choose|select|change) (your )?(country|region)/i;
export function tidyScript(selectors, hideText = []) {
  const extra = hideText.map((text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const source = [PROMPT_TEXT.source, ...extra].join("|");
  return `(() => {
    const reject = new RegExp(${JSON.stringify(REJECT_BUTTON.source)}, "i");
    const prompt = new RegExp(${JSON.stringify(source)}, "i");
    const css = ${JSON.stringify(selectors.join(",") + "{display:none !important}")};
    let clicked = false;
    const tidy = () => {
      if (!document.body) return;
      if (!document.getElementById("__bpu_tidy")) {
        const style = document.createElement("style");
        style.id = "__bpu_tidy";
        style.textContent = css;
        (document.head || document.documentElement).appendChild(style);
      }
      if (!clicked) {
        const button = [...document.querySelectorAll("button, [role=button]")]
          .find((el) => reject.test((el.innerText || el.textContent || "").trim()));
        if (button) { button.click(); clicked = true; }
      }
      for (const el of document.querySelectorAll("body *")) {
        const position = getComputedStyle(el).position;
        const dialog = el.getAttribute("role") === "dialog" || el.getAttribute("aria-modal") === "true";
        if (position !== "fixed" && position !== "sticky" && !dialog) continue;
        if (prompt.test((el.innerText || "").slice(0, 600))) el.style.setProperty("display", "none", "important");
      }
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
    window.__bpuTidy = tidy;
    const timer = setInterval(tidy, 500);
    setTimeout(() => clearInterval(timer), 20000);
    document.addEventListener("DOMContentLoaded", tidy);
  })();`;
}
export function isBlockedPage(text, html = "") {
  return BLOCKED_PAGE.test(text.slice(0, 4000)) || BLOCKED_MARKUP.test(html.slice(0, 200_000));
}
export const DEFAULT_WIDTH = 1440;
export const DEFAULT_HEIGHT = 900;
export const CONSENT_SELECTORS = [
  "#onetrust-consent-sdk",
  "#onetrust-banner-sdk",
  "#CybotCookiebotDialog",
  "#usercentrics-root",
  "#truste-consent-track",
  "#didomi-host",
  ".qc-cmp2-container",
  "#sp_message_container_",
  "[id^='sp_message_container']",
  ".osano-cm-window",
  "#cookie-banner",
  "#cookiebanner",
  ".cookie-banner",
  "[class*='cookie-consent']",
  "[class*='CookieConsent']",
  "[aria-label*='cookie' i][role='dialog']",
  "[aria-label*='consent' i][role='dialog']",
  "#transcend-consent-manager",
  "[id*='consent-manager' i]",
  "#intercom-container",
  "#hubspot-messages-iframe-container",
  ".drift-frame-controller",
];
export function parseVisualPlan(markdown) {
  const items = [];
  const blocks = markdown.matchAll(/```visual\s*\n([\s\S]*?)```/g);
  for (const [, body] of blocks) {
    let raw;
    try {
      raw = JSON.parse(body);
    } catch {
      throw new Error(`a visual block is not valid JSON:\n${body.trim()}`);
    }
    items.push(validate(raw));
  }
  const seen = new Set();
  for (const item of items) {
    if (seen.has(item.id)) throw new Error(`visual id "${item.id}" is used twice`);
    seen.add(item.id);
  }
  return items;
}
function validate(raw) {
  if (typeof raw !== "object" || raw === null) throw new Error("a visual block must be a JSON object");
  const item = raw;
  const id = item.id;
  if (typeof id !== "string" || !/^[a-z0-9][a-z0-9-]*$/.test(id)) {
    throw new Error(`visual id must be lower-case letters, digits and dashes: ${JSON.stringify(id)}`);
  }
  if (item.kind !== "screenshot" && item.kind !== "html") {
    throw new Error(`visual "${id}": kind must be "screenshot" or "html"`);
  }
  if (typeof item.file !== "string" || !/^[a-z0-9][a-z0-9._-]*\.png$/i.test(item.file)) {
    throw new Error(`visual "${id}": file must be a plain .png file name`);
  }
  if (item.kind === "screenshot" && (typeof item.url !== "string" || !/^https?:\/\//.test(item.url))) {
    throw new Error(`visual "${id}": a screenshot needs an http(s) url`);
  }
  if (item.kind === "html" && (typeof item.source !== "string" || item.source.trim() === "")) {
    throw new Error(`visual "${id}": an html visual needs a source file`);
  }
  for (const key of ["width", "height", "wait"]) {
    if (item[key] !== undefined && (typeof item[key] !== "number" || item[key] <= 0)) {
      throw new Error(`visual "${id}": ${key} must be a positive number`);
    }
  }
  if (item.hide !== undefined && (!Array.isArray(item.hide) || item.hide.some((s) => typeof s !== "string"))) {
    throw new Error(`visual "${id}": hide must be a list of CSS selectors`);
  }
  if (item.hide_text !== undefined && (!Array.isArray(item.hide_text) || item.hide_text.some((s) => typeof s !== "string" || s.trim() === ""))) {
    throw new Error(`visual "${id}": hide_text must be a list of non-empty strings`);
  }
  for (const key of ["alt", "caption"]) {
    if (item[key] !== undefined && typeof item[key] !== "string") throw new Error(`visual "${id}": ${key} must be text`);
  }
  if (item.lang !== undefined && (typeof item.lang !== "string" || !/^[a-z]{2}(-[A-Z]{2})?$/.test(item.lang))) {
    throw new Error(`visual "${id}": lang must look like "en-US"`);
  }
  return item;
}
export function browserCandidates(platform = process.platform, env = process.env) {
  const fromEnv = env.CHROME_PATH?.trim();
  const list = fromEnv ? [fromEnv] : [];
  if (platform === "win32") {
    const roots = [env.PROGRAMFILES, env["PROGRAMFILES(X86)"], env.LOCALAPPDATA].filter((root) => typeof root === "string" && root !== "");
    for (const root of roots) {
      list.push(path.join(root, "Google", "Chrome", "Application", "chrome.exe"));
      list.push(path.join(root, "Microsoft", "Edge", "Application", "msedge.exe"));
    }
  } else if (platform === "darwin") {
    list.push("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome");
    list.push("/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge");
    list.push("/Applications/Chromium.app/Contents/MacOS/Chromium");
  } else {
    list.push("/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/microsoft-edge");
  }
  return list;
}
export function findBrowser(platform = process.platform, env = process.env) {
  return browserCandidates(platform, env).find((candidate) => fs.existsSync(candidate)) ?? null;
}
class Cdp {
  nextId = 1;
  pending = new Map();
  listeners = [];
  socket;
  constructor(socket) {
    this.socket = socket;
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (message.id !== undefined) {
        const waiter = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) waiter?.reject(new Error(message.error.message));
        else waiter?.resolve(message.result);
      } else if (message.method) {
        for (const listener of this.listeners) listener(message.method, message.params);
      }
    });
  }
  static open(url) {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(url);
      socket.addEventListener("open", () => resolve(new Cdp(socket)));
      socket.addEventListener("error", () => reject(new Error(`could not connect to ${url}`)));
    });
  }
  send(method, params = {}) {
    const id = this.nextId++;
    this.socket.send(
      JSON.stringify({
        id,
        method,
        params,
      }),
    );
    return new Promise((resolve, reject) =>
      this.pending.set(id, {
        resolve: resolve,
        reject,
      }),
    );
  }
  once(method, timeoutMs) {
    return new Promise((resolve) => {
      const timer = setTimeout(resolve, timeoutMs);
      this.listeners.push((name) => {
        if (name === method) {
          clearTimeout(timer);
          resolve();
        }
      });
    });
  }
  close() {
    this.socket.close();
  }
}
async function launch(browser, profile) {
  const child = spawn(
    browser,
    [
      "--headless=new",
      "--remote-debugging-port=0",
      `--user-data-dir=${profile}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--hide-scrollbars",
      "--mute-audio",
      "about:blank",
    ],
    {
      stdio: ["ignore", "ignore", "pipe"],
    },
  );
  const endpoint = await new Promise((resolve, reject) => {
    let buffer = "";
    const timer = setTimeout(() => reject(new Error("the browser did not open a DevTools endpoint within 20s")), 20_000);
    child.stderr?.on("data", (chunk) => {
      buffer += chunk.toString();
      const match = buffer.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        clearTimeout(timer);
        resolve(match[1]);
      }
    });
    child.on("exit", (code) => reject(new Error(`the browser exited (${code}) before it was ready`)));
  });
  return {
    child,
    endpoint,
  };
}
async function pageEndpoint(browserEndpoint) {
  const port = new URL(browserEndpoint).port;
  const response = await fetch(`http://127.0.0.1:${port}/json/list`);
  const targets = await response.json();
  const page = targets.find((target) => target.type === "page");
  if (!page) throw new Error("the browser opened no page");
  return page.webSocketDebuggerUrl;
}
export async function renderVisuals(items, runDir, outDir, browser) {
  fs.mkdirSync(outDir, {
    recursive: true,
  });
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "bpu-visuals-"));
  const { child, endpoint } = await launch(browser, profile);
  const rendered = [];
  const failed = [];
  try {
    const cdp = await Cdp.open(await pageEndpoint(endpoint));
    await cdp.send("Page.enable");
    for (const item of items) {
      try {
        rendered.push(await renderOne(cdp, item, runDir, outDir));
      } catch (error) {
        failed.push({
          id: item.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    cdp.close();
  } finally {
    child.kill();
    try {
      fs.rmSync(profile, {
        recursive: true,
        force: true,
      });
    } catch {}
  }
  return {
    rendered,
    failed,
  };
}
async function renderOne(cdp, item, runDir, outDir) {
  const width = item.width ?? DEFAULT_WIDTH;
  const height = item.height ?? DEFAULT_HEIGHT;
  const target = item.kind === "screenshot" ? item.url : pathToFileURL(path.resolve(runDir, item.source)).href;
  if (item.kind === "html" && !fs.existsSync(path.resolve(runDir, item.source))) {
    throw new Error(`source ${item.source} does not exist`);
  }
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
  const lang = item.lang ?? DEFAULT_LANG;
  await cdp.send("Network.enable");
  await cdp.send("Network.setExtraHTTPHeaders", {
    headers: {
      "Accept-Language": `${lang},${lang.slice(0, 2)};q=0.9`,
    },
  });
  await cdp
    .send("Emulation.setLocaleOverride", {
      locale: lang.replace("-", "_"),
    })
    .catch(() => undefined);
  const { identifier } = await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
    source: tidyScript([...CONSENT_SELECTORS, ...(item.hide ?? [])], item.hide_text ?? []),
  });
  const loaded = cdp.once("Page.loadEventFired", 30_000);
  await cdp.send("Page.navigate", {
    url: target,
  });
  await loaded;
  await new Promise((resolve) => setTimeout(resolve, item.wait ?? (item.kind === "screenshot" ? 4000 : 300)));
  await cdp.send("Runtime.evaluate", {
    expression: "window.__bpuTidy && window.__bpuTidy(); window.scrollTo(0, 0)",
  });
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (item.kind === "screenshot") {
    const read = (expression) =>
      cdp.send("Runtime.evaluate", {
        expression,
        returnByValue: true,
      });
    const text = await read("document.title + ' ' + (document.body ? document.body.innerText : '')");
    const html = await read("document.documentElement.outerHTML");
    if (isBlockedPage(text.result.value ?? "", html.result.value ?? "")) {
      throw new Error("the page answered with a bot check or block page; capture it by hand in a normal browser");
    }
  }
  const shot = await cdp.send("Page.captureScreenshot", {
    format: "png",
    clip: {
      x: 0,
      y: 0,
      width,
      height,
      scale: 1,
    },
  });
  await cdp.send("Page.removeScriptToEvaluateOnNewDocument", {
    identifier,
  });
  const bytes = Buffer.from(shot.data, "base64");
  fs.writeFileSync(path.join(outDir, item.file), bytes);
  return {
    id: item.id,
    file: item.file,
    from: item.kind === "screenshot" ? item.url : item.source,
    sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
    width,
    height,
    rendered_at: new Date().toISOString(),
  };
}
