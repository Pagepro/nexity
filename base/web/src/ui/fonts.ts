import { Inter } from "next/font/google";

// To use your own font, swap this loader (next/font/google or next/font/local) and keep a
// `variable` that `--font-sans` in app.css reads. See DESIGN.md.
export const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});
