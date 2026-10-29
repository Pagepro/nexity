import type { ExtractSectionProps } from "@/types/sections";

export const trustBadgesFixture = {
  _type: "trust-badges",
  _key: "gallery-fixture-trust-badges",
  badges: [
    { _key: "soc2", icon: "shield-check", label: "SOC 2 Type II" },
    { _key: "gdpr", icon: "lock", label: "GDPR ready" },
    { _key: "sso", icon: "key-round", label: "SSO / SAML" },
    { _key: "uptime", icon: "activity", label: "99.9% uptime" },
  ],
} satisfies ExtractSectionProps<"trust-badges">;
