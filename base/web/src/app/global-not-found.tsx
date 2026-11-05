import type { Metadata } from "next";

import { ErrorState } from "@/ui/error-state";
import { inter } from "@/ui/fonts";
import "@/styles/app.css";

// Serves URLs Next answers before routing (`/404`, its `/_not-found` page): with one root layout
// per route group there is none to render them in. Needs `experimental.globalNotFound`.
// Every other missing path goes through the catchall to `(frontend)/not-found.tsx`.
export const metadata: Metadata = {
  title: "Page not found",
};

const GlobalNotFound = () => (
  <html lang="en">
    <body className={`antialiased ${inter.variable}`}>
      <main id="main-content">
        <ErrorState
          code="404"
          title="Page not found"
          description="The link may be broken, or the page was moved or removed. Check the address or start over from the homepage."
        />
      </main>
    </body>
  </html>
);

export default GlobalNotFound;
