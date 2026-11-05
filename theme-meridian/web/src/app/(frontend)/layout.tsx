import type { Metadata } from "next";

import { IS_INDEXABLE } from "@/lib/env";
import { monaSans } from "@/ui/fonts";
import { SiteFrame } from "@/ui/site-frame";
import "@/styles/app.css";

// Fallback for a route without its own `robots`; pages set theirs via buildRobotsAndAlternates.
export const metadata: Metadata = IS_INDEXABLE
  ? {}
  : { robots: { index: false, follow: false } };

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  /*
    Next reads `data-scroll-behavior`, not the computed style, to pause smooth
    scrolling during a route change; without it each navigation animates twice.
  */
  <html lang="en" data-scroll-behavior="smooth">
    {/* No preconnect to cdn.sanity.io: images go through /_next/image and /cdn-sanity. */}
    <body className={`antialiased ${monaSans.variable}`}>
      <SiteFrame>{children}</SiteFrame>
    </body>
  </html>
);

export default RootLayout;
