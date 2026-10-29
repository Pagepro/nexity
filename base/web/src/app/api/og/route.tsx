import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

import { getSite } from "@/sanity/lib/queries/site";

// Satori can't read CSS variables, so the neutral palette is inlined as hex.
const BACKGROUND_COLOR = "#fafafa"; // neutral-50 (--card-muted)
const FOREGROUND_COLOR = "#0a0a0a"; // neutral-950 (--foreground)
const MUTED_COLOR = "#737373"; // neutral-500 (--muted-foreground)

// Satori can't read WOFF2; Google Fonts serves TrueType URLs to a request without a
// browser User-Agent. If Google is unreachable, next/og's default font is used.
const INTER_CSS_URL = "https://fonts.googleapis.com/css2?family=Inter:wght@500";

const loadInter = async (): Promise<ArrayBuffer | null> => {
  try {
    const css = await (await fetch(INTER_CSS_URL)).text();
    const fontUrl = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
    if (!fontUrl) return null;
    const response = await fetch(fontUrl);
    return response.ok ? await response.arrayBuffer() : null;
  } catch {
    return null;
  }
};

let interPromise: Promise<ArrayBuffer | null> | undefined;
const getInter = () => {
  interPromise ??= loadInter().then((data) => {
    if (!data) interPromise = undefined;
    return data;
  });
  return interPromise;
};

const SITE_HOST = process.env.NEXT_PUBLIC_BASE_URL?.replace(/^https?:\/\//, "");

export const GET = async (request: NextRequest) => {
  const [site, fontData] = await Promise.all([getSite().catch(() => null), getInter()]);
  const siteTitle = site?.title;

  // Page titles arrive as "Page — Site"; the site name is already in the footer row.
  const rawTitle = request.nextUrl.searchParams.get("title") ?? "";
  const title = siteTitle
    ? rawTitle.replace(/\s*[-—|]+\s*([^-—|]*)$/, (suffix, name: string) =>
        name.trim() === siteTitle ? "" : suffix,
      )
    : rawTitle;

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        padding: 80,
        backgroundColor: BACKGROUND_COLOR,
        color: FOREGROUND_COLOR,
        fontFamily: fontData ? "Inter" : undefined,
      }}
    >
      <div style={{ display: "flex", fontSize: 72, lineHeight: 1.1, lineClamp: 4 }}>
        {title || siteTitle}
      </div>
      <div style={{ display: "flex", fontSize: 28, color: MUTED_COLOR }}>
        {SITE_HOST || siteTitle}
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: fontData
        ? [{ name: "Inter", data: fontData, weight: 500, style: "normal" }]
        : undefined,
    },
  );
};
