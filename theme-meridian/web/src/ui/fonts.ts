import localFont from "next/font/local";

// WOFF2 subsets: regenerate from the TTFs (kept for tools/product-mocks) with `pyftsubset`,
// one run per weight and range. Keep CORE_RANGE / EXT_RANGE below in sync with the files.
// Only the 400 + 500 core files are preloaded. `declarations` pins every call to the
// `monaSans` family so the browser sees one family. Font loader options must be literals,
// hence the repeated strings.

export const monaSans = localFont({
  variable: "--font-mona-sans",
  display: "swap",
  // Per-weight metric-matched fallback faces live in app.css ("monaSans
  // Fallback", appended to --font-sans); Next's single face fits no weight well.
  adjustFontFallback: false,
  declarations: [
    { prop: "font-family", value: "monaSans" },
    // CORE_RANGE
    {
      prop: "unicode-range",
      value:
        "U+0020-007E, U+00A0, U+00A9, U+00AE, U+00B0, U+00B7, U+00D7, U+2010-2027, U+2039-203A, U+20AC, U+2122, U+2190-2193, U+2212",
    },
  ],
  src: [
    {
      path: "../styles/fonts/MonaSans/MonaSans_SemiExpanded-Regular.subset-core.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../styles/fonts/MonaSans/MonaSans_SemiExpanded-Medium.subset-core.woff2",
      weight: "500",
      style: "normal",
    },
  ],
});

// Nothing applies its className: importing this module emits the CSS.
export const monaSansExtraWeights = localFont({
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    { prop: "font-family", value: "monaSans" },
    // CORE_RANGE
    {
      prop: "unicode-range",
      value:
        "U+0020-007E, U+00A0, U+00A9, U+00AE, U+00B0, U+00B7, U+00D7, U+2010-2027, U+2039-203A, U+20AC, U+2122, U+2190-2193, U+2212",
    },
  ],
  src: [
    {
      path: "../styles/fonts/MonaSans/MonaSans_SemiExpanded-Light.subset-core.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../styles/fonts/MonaSans/MonaSans_SemiExpanded-SemiBold.subset-core.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../styles/fonts/MonaSans/MonaSans_SemiExpanded-Bold.subset-core.woff2",
      weight: "700",
      style: "normal",
    },
  ],
});

export const monaSansExtendedLatin = localFont({
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    { prop: "font-family", value: "monaSans" },
    // EXT_RANGE
    {
      prop: "unicode-range",
      value:
        "U+00A1-00A8, U+00AA-00AD, U+00AF, U+00B1-00B6, U+00B8-00D6, U+00D8-00FF, U+0100-017F, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-200F, U+202A-2038, U+203B-206F, U+2215",
    },
  ],
  src: [
    {
      path: "../styles/fonts/MonaSans/MonaSans_SemiExpanded-Light.subset-ext.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../styles/fonts/MonaSans/MonaSans_SemiExpanded-Regular.subset-ext.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../styles/fonts/MonaSans/MonaSans_SemiExpanded-Medium.subset-ext.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../styles/fonts/MonaSans/MonaSans_SemiExpanded-SemiBold.subset-ext.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../styles/fonts/MonaSans/MonaSans_SemiExpanded-Bold.subset-ext.woff2",
      weight: "700",
      style: "normal",
    },
  ],
});
