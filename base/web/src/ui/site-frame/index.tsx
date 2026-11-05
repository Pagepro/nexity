import { getSetupStatus } from "@/sanity/lib/queries/setup-status";
import { ConsentManagerLazy } from "@/ui/cookie-consent/consent-manager-lazy";
import Footer from "@/ui/footer";
import { GettingStarted } from "@/ui/getting-started";
import Header from "@/ui/header";
import { InteractionProvider } from "@/ui/providers/interaction-provider";
import VisualEditingControls from "@/ui/VisualEditingControls";

/** Everything inside `<body>` around a page; shared by the root layout and `global-not-found`. */
export const SiteFrame = async ({ children }: { children: React.ReactNode }) => {
  const setupStatus = await getSetupStatus();

  return (
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
  );
};
