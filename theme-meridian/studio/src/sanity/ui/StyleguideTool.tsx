import { Box, Card, Flex, Tab, TabList, Text } from "@sanity/ui";
import { useState } from "react";
import { useCurrentUser } from "sanity";

import { PREVIEW_URL_PREFIX } from "../lib/preview-origin";

// Embedded /admin uses a relative path, so a Vercel preview iframes itself, not prod.
// A standalone Studio doesn't serve /styleguide: set SANITY_STUDIO_APP_URL there.
const APP_ORIGIN = (process.env.SANITY_STUDIO_APP_URL || PREVIEW_URL_PREFIX).replace(
  /\/+$/,
  "",
);
const iframeSrc = (path: string) => `${APP_ORIGIN}${path}`;

const TABS = [
  { id: "styleguide", label: "Design", path: "/styleguide" },
  { id: "sections", label: "Sections", path: "/styleguide/sections" },
] as const;

// Hiding the tool isn't securing it: the routes also gate themselves
// (`StudioAuthGate` in web/src/ui/styleguide/studio-auth-gate.tsx).
const ALLOWED_ROLES = ["administrator", "editor"];

// A standalone (cross-origin) Studio needs a route-scoped CSP `frame-ancestors` on the app.
export const StyleguideTool = () => {
  const user = useCurrentUser();
  const isAuthorized = user?.roles?.some(
    (role) => role.name && ALLOWED_ROLES.includes(role.name),
  );
  const [activeId, setActiveId] = useState<(typeof TABS)[number]["id"]>("styleguide");

  if (!isAuthorized) {
    return (
      <Flex align="center" justify="center" padding={5} style={{ height: "100%" }}>
        <Text muted size={1}>
          Available to Studio members with an editor or administrator role.
        </Text>
      </Flex>
    );
  }

  const activeTab = TABS.find((tab) => tab.id === activeId) ?? TABS[0];

  return (
    <Flex direction="column" style={{ height: "100%" }}>
      <Card paddingX={3} paddingY={2} borderBottom>
        <TabList gap={2}>
          {TABS.map((tab) => (
            <Tab
              key={tab.id}
              id={`${tab.id}-tab`}
              aria-controls={`${tab.id}-panel`}
              label={tab.label}
              selected={tab.id === activeId}
              onClick={() => setActiveId(tab.id)}
            />
          ))}
        </TabList>
      </Card>

      <Box flex={1} style={{ position: "relative" }}>
        <iframe
          key={activeTab.id}
          src={iframeSrc(activeTab.path)}
          title={activeTab.label}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            border: "none",
          }}
        />
      </Box>
    </Flex>
  );
};
