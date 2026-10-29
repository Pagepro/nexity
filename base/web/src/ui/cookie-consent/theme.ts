import type { ConsentProviderOptions, Theme } from "@c15t/nextjs";

// The UI renders in a body-level portal, so only the light `:root` tokens apply. Use only
// variables `app.css` emits; radius and shadow are literals (`@theme inline` emits no variable).

const FONT_FAMILY = "var(--font-inter), ui-sans-serif, system-ui, sans-serif";
const CARD_RADIUS = "0"; // matches rounded-xl (--radius-xl)
// Tailwind's default `shadow-lg`
const CARD_SHADOW = "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)";
const SCRIM = "color-mix(in oklab, var(--foreground) 50%, transparent)";

export const cookieConsentTheme = {
  colors: {
    primary: "var(--primary)",
    primaryHover: "color-mix(in oklab, var(--primary) 88%, white)",
    textOnPrimary: "var(--primary-foreground)",
    surface: "var(--background)",
    surfaceHover: "var(--muted)",
    border: "var(--border)",
    borderHover: "var(--border)",
    text: "var(--foreground)",
    textMuted: "var(--muted-foreground)",
    overlay: SCRIM,
    switchTrack: "var(--input)",
    switchTrackActive: "var(--primary)",
    switchThumb: "var(--background)",
  },
  typography: {
    fontFamily: FONT_FAMILY,
    fontWeight: { medium: 500 },
  },
  radius: {
    lg: CARD_RADIUS,
    full: "9999px",
  },
  shadows: {
    lg: CARD_SHADOW,
  },
  // Accept and Reject must look the same: refusing as easy as agreeing (EU consent
  // guidance; c15t warns in the console when they differ).
  consentActions: {
    accept: { variant: "primary", mode: "filled" },
    reject: { variant: "primary", mode: "filled" },
    customize: { variant: "neutral", mode: "ghost" },
  },
} satisfies Theme;

export const cookieConsentComponents = {
  banner: { card: { style: { maxWidth: "440px" } } },
  dialog: { title: { style: { fontSize: "1.125rem" } } },
} satisfies ConsentProviderOptions["components"];
