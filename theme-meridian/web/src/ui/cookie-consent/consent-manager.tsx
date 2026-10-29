"use client";

import { googleTagManager } from "@c15t/integrations/google-tag-manager";
import {
  ConsentBanner,
  ConsentDialog,
  ConsentProvider,
  ConsentTheme,
} from "@c15t/nextjs";
import { offline } from "@c15t/react";

import { cookieConsentComponents, cookieConsentTheme } from "./theme";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

// GTM loads only through c15t, never as its own snippet. Registering it is what adds the
// Measurement and Marketing categories; without NEXT_PUBLIC_GTM_ID the dialog lists only Necessary.
// Switch to `loadMode: "always"` for Consent Mode cookieless pings before a choice (check with the DPO).
const scripts = GTM_ID
  ? [googleTagManager({ id: GTM_ID, loadMode: "after-consent" })]
  : [];

// No consent backend: choices live in the `c15t` cookie. `offline` is the provider
// transport from @c15t/react, not the `c15t.config.ts` mode that @c15t/nextjs exports.
const options = {
  mode: offline(),
  theme: cookieConsentTheme,
  components: cookieConsentComponents,
  scripts,
};

// Nothing else reads consent, so the provider wraps only the banner and dialog; c15t injects
// its CSS as <style>, so it all ships in this lazy chunk.
const ConsentManager = () => (
  <ConsentProvider options={options}>
    <ConsentTheme theme={cookieConsentTheme} />
    <ConsentBanner hideBranding />
    <ConsentDialog hideBranding />
  </ConsentProvider>
);

export default ConsentManager;
