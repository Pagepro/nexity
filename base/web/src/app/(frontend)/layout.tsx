import type { Metadata } from "next";

import { IS_INDEXABLE } from "@/lib/env";
import { getSetupStatus } from "@/sanity/lib/queries/setup-status";
import { ConsentManagerLazy } from "@/ui/cookie-consent/consent-manager-lazy";
import { inter } from "@/ui/fonts";
import Footer from "@/ui/footer";
import { GettingStarted } from "@/ui/getting-started";
import Header from "@/ui/header";
import { InteractionProvider } from "@/ui/providers/interaction-provider";
import VisualEditingControls from "@/ui/VisualEditingControls";
import "@/styles/app.css";

// Fallback for a route without its own `robots`; pages set theirs via buildRobotsAndAlternates.
export const metadata: Metadata = IS_INDEXABLE
  ? {}
  : { robots: { index: false, follow: false } };

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const setupStatus = await getSetupStatus();

  return (
    /*
    Next reads `data-scroll-behavior`, not the computed style, to pause smooth
    scrolling during a route change; without it each navigation animates twice.
  */
    <html lang="en" data-scroll-behavior="smooth">
      {/* No preconnect to cdn.sanity.io: images go through /_next/image and /cdn-sanity. */}
      <body className={`antialiased ${inter.variable}`}>
        <InteractionProvider>
          {setupStatus.isComplete ? (
            <>
              <Header />
              {/* Hero sections pull back up with -mt to sit under the fixed header. */}
              <main id="main-content" tabIndex={-1} className="pt-[var(--header-height)]">
                {children}
              </main>
              <Footer />
            </>
          ) : (
            <main id="main-content" tabIndex={-1}>
              <GettingStarted status={setupStatus} />
            </main>
          )}

          <VisualEditingControls />
          <ConsentManagerLazy />
        </InteractionProvider>
      </body>
    </html>
  );
};

export default RootLayout;
