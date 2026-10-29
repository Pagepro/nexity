import type { Metadata } from "next";

import { inter } from "@/ui/fonts";
import "@/styles/app.css";

export const metadata: Metadata = {
  title: "Design System · Nexity",
  robots: { index: false, follow: false },
};

const StyleguideLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth">
    <body className={`bg-background text-foreground antialiased ${inter.variable}`}>
      {children}
    </body>
  </html>
);

export default StyleguideLayout;
