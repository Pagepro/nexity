import type { Metadata } from "next";

import { monaSans } from "@/ui/fonts";
import "@/styles/app.css";

export const metadata: Metadata = {
  title: "Design System · Meridian",
  robots: { index: false, follow: false },
};

const StyleguideLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth">
    <body className={`bg-background text-foreground antialiased ${monaSans.variable}`}>
      {children}
    </body>
  </html>
);

export default StyleguideLayout;
