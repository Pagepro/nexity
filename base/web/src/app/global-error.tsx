"use client";

import Button from "@/ui/components/button";
import { ErrorState } from "@/ui/error-state";
import { inter } from "@/ui/fonts";
import "@/styles/app.css";

/** Replaces the root layout when it throws (e.g. Sanity unreachable), so no header or footer. */
const GlobalError = ({ retry }: { error: unknown; retry: () => void }) => (
  <html lang="en">
    <body className={`antialiased ${inter.variable}`}>
      <title>Something went wrong</title>
      <main id="main-content">
        <ErrorState
          code="500"
          title="Something went wrong"
          description="The site failed to load. Try again in a moment, or start over from the homepage."
          actions={<Button onClick={retry}>Try again</Button>}
        />
      </main>
    </body>
  </html>
);

export default GlobalError;
