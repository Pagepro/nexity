import type { Metadata } from "next";

import { buildSeoTitle } from "@/lib/seo-title";
import { getSite } from "@/sanity/lib/queries/site";
import { ErrorState } from "@/ui/error-state";
import { inter } from "@/ui/fonts";
import { SiteFrame } from "@/ui/site-frame";
import "@/styles/app.css";

// Serves URLs Next answers before routing (`/404`, its `/_not-found` page): with one root layout
// per route group there is none to render them in, so it repeats `(frontend)/layout.tsx`.
// Needs `experimental.globalNotFound`. Every other missing path goes through the catchall to
// `(frontend)/not-found.tsx`.
export const generateMetadata = async (): Promise<Metadata> => {
  // Next prerenders this page at build, where getSite() throws without a Site document.
  const site = await getSite().catch(() => null);

  return {
    title: buildSeoTitle({ metadata: null, documentTitle: "Page not found", site }),
  };
};

const GlobalNotFound = () => (
  <html lang="en" data-scroll-behavior="smooth">
    <body className={`antialiased ${inter.variable}`}>
      <SiteFrame>
        <ErrorState
          code="404"
          title="Page not found"
          description="The link may be broken, or the page was moved or removed. Check the address or start over from the homepage."
        />
      </SiteFrame>
    </body>
  </html>
);

export default GlobalNotFound;
