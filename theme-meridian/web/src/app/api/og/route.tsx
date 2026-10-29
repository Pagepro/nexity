import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { getSite } from "@/sanity/lib/queries/site";

// Satori can't read CSS variables, so the Stone palette is inlined as hex.
const BACKGROUND_COLOR = "#fafaf9";
const FOREGROUND_COLOR = "#1c1917";
const MUTED_COLOR = "#78716c";

const FONT_PATH = join(
  process.cwd(),
  "src/styles/fonts/MonaSans/MonaSans_SemiExpanded-Medium.ttf",
);

const SITE_HOST = process.env.NEXT_PUBLIC_BASE_URL?.replace(/^https?:\/\//, "");

export const GET = async (request: NextRequest) => {
  const [site, fontData] = await Promise.all([
    getSite().catch(() => null),
    readFile(FONT_PATH),
  ]);
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
        fontFamily: "Mona Sans",
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
      fonts: [{ name: "Mona Sans", data: fontData, weight: 500, style: "normal" }],
    },
  );
};
