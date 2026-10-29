// SERVER-ONLY. Reads tokens from the app.css source, not the live `:root`: Tailwind v4
// only exposes an @theme variable when the page uses its utility, and `@theme inline`
// tokens emit none. Runs at build time; the values are baked into the static page.

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { remToPx } from "./format";
import type { DesignToken, DesignTokensModel } from "./use-design-tokens";

const CSS_PATH = join(process.cwd(), "src/styles/app.css");

/** Body of the FIRST `<selector> { … }` block (token blocks have no nested braces). */
const firstBlockBody = (css: string, selectorPattern: string): string => {
  const match = css.match(new RegExp(`${selectorPattern}\\s*\\{([^}]*)\\}`));
  return match ? match[1] : "";
};

const allBlockBodies = (css: string, selectorPattern: string): string[] => {
  const regexp = new RegExp(`${selectorPattern}\\s*\\{([^}]*)\\}`, "g");
  const bodies: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regexp.exec(css)) !== null) bodies.push(match[1]);
  return bodies;
};

const parseDeclarations = (body: string): Record<string, string> => {
  const out: Record<string, string> = {};
  const regexp = /(--[\w-]+)\s*:\s*([^;]+);/g;
  let match: RegExpExecArray | null;
  while ((match = regexp.exec(body)) !== null) {
    out[match[1]] = match[2].replace(/\/\*.*?\*\//g, "").trim();
  }
  return out;
};

const ROOT_FONT_PX = 16;
const COLOR_VALUE = /^(#|oklch\(|rgb|hsl|color\()/i;

export const parseDesignTokens = (): DesignTokensModel => {
  let css = "";
  try {
    css = readFileSync(CSS_PATH, "utf8");
  } catch {
    return { ready: true, all: [], byName: {} };
  }

  const light = parseDeclarations(firstBlockBody(css, ":root"));
  const dark = parseDeclarations(firstBlockBody(css, "@variant\\s+dark-palette"));
  const theme: Record<string, string> = {};
  for (const body of allBlockBodies(css, "@theme(?:\\s+\\w+)*")) {
    Object.assign(theme, parseDeclarations(body));
  }

  const names = Array.from(
    new Set([...Object.keys(theme), ...Object.keys(light), ...Object.keys(dark)]),
  ).sort();

  const all: DesignToken[] = names.map((name) => {
    const value = light[name] ?? theme[name] ?? dark[name] ?? "";
    const darkValue = dark[name] && dark[name] !== value ? dark[name] : undefined;
    const isColor = COLOR_VALUE.test(value);
    return {
      name,
      short: name.replace(/^--/, ""),
      value,
      darkValue,
      px: remToPx(value, ROOT_FONT_PX),
      isAlias: value.startsWith("var("),
      isColor,
    };
  });

  const byName = all.reduce<Record<string, DesignToken>>((accumulator, token) => {
    accumulator[token.short] = token;
    return accumulator;
  }, {});

  return { ready: true, all, byName };
};
