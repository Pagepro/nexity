import { Box, Card, Flex, Spinner, Stack, Tab, TabList, Text } from "@sanity/ui";
import { VscGlobe, VscWarning } from "react-icons/vsc";

import type { Device } from "./constants";

export type PreviewStatus = "loading" | "ready" | "noindex";

interface SearchAppearancePreviewProps {
  siteName: string;
  faviconUrl?: string;
  breadcrumb: string;
  title: string;
  description: string;
  date?: string;
  device: Device;
  onDeviceChange: (device: Device) => void;
  status: PreviewStatus;
  isNoFollow: boolean;
}

const TITLE_BLUE = "#1a73e8";

interface DeviceToggleProps {
  device: Device;
  onDeviceChange: (device: Device) => void;
}

const DeviceToggle = ({ device, onDeviceChange }: DeviceToggleProps) => (
  <TabList gap={1}>
    <Tab
      aria-controls="search-appearance-panel"
      id="search-appearance-tab-mobile"
      label="Mobile"
      selected={device === "mobile"}
      onClick={() => onDeviceChange("mobile")}
    />
    <Tab
      aria-controls="search-appearance-panel"
      id="search-appearance-tab-desktop"
      label="Desktop"
      selected={device === "desktop"}
      onClick={() => onDeviceChange("desktop")}
    />
  </TabList>
);

const Favicon = ({ faviconUrl }: { faviconUrl?: string }) => (
  <Flex
    align="center"
    justify="center"
    style={{
      width: 26,
      height: 26,
      borderRadius: "50%",
      overflow: "hidden",
      flex: "none",
      border: "1px solid var(--card-border-color, rgba(128,128,128,0.3))",
    }}
  >
    {faviconUrl ? (
      <img
        alt=""
        src={faviconUrl}
        width={26}
        height={26}
        style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
      />
    ) : (
      <Text size={1} muted>
        <VscGlobe aria-hidden />
      </Text>
    )}
  </Flex>
);

const Snippet = ({
  siteName,
  faviconUrl,
  breadcrumb,
  title,
  description,
  date,
}: Pick<
  SearchAppearancePreviewProps,
  "siteName" | "faviconUrl" | "breadcrumb" | "title" | "description" | "date"
>) => (
  <Stack gap={3}>
    <Flex align="center" gap={2}>
      <Favicon faviconUrl={faviconUrl} />
      <Stack gap={2}>
        <Text size={1} weight="medium">
          {siteName || "Your site"}
        </Text>
        <Text size={1} muted>
          {breadcrumb || siteName || "Your site"}
        </Text>
      </Stack>
    </Flex>

    {/* Not an anchor: assistive tech would announce a broken link in the editor. */}
    <Text size={3} style={{ color: TITLE_BLUE }}>
      {title || "Untitled document"}
    </Text>

    <Text size={1} muted>
      {date ? <span style={{ opacity: 0.85 }}>{date} — </span> : null}
      {description || "No description yet — add an SEO description below."}
    </Text>
  </Stack>
);

const NoFollowNote = () => (
  <Text size={1} muted>
    <strong>nofollow</strong> — search engines are asked not to follow the links on this
    page.
  </Text>
);

const NoIndexBanner = () => (
  <Card padding={3} radius={2} tone="caution" border>
    <Flex align="center" gap={2}>
      <Text size={1}>
        <VscWarning aria-hidden />
      </Text>
      <Text size={1}>
        This page is set to <strong>noindex</strong> — it will not appear in Google
        results.
      </Text>
    </Flex>
  </Card>
);

export const SearchAppearancePreview = (props: SearchAppearancePreviewProps) => {
  const { device, onDeviceChange, status, isNoFollow } = props;

  return (
    <Stack gap={3}>
      <Flex align="center" justify="space-between" gap={3} wrap="wrap">
        <Text size={1} weight="semibold" muted>
          Search appearance
        </Text>
        <DeviceToggle device={device} onDeviceChange={onDeviceChange} />
      </Flex>

      <Card
        id="search-appearance-panel"
        padding={4}
        radius={3}
        shadow={1}
        border
        style={{ maxWidth: device === "mobile" ? 360 : 600 }}
      >
        {status === "loading" ? (
          <Flex align="center" gap={2} paddingY={2}>
            <Spinner muted />
            <Text size={1} muted>
              Loading preview…
            </Text>
          </Flex>
        ) : status === "noindex" ? (
          <Stack gap={3}>
            <NoIndexBanner />
            <Box style={{ opacity: 0.5 }}>
              <Snippet {...props} />
            </Box>
          </Stack>
        ) : (
          <Snippet {...props} />
        )}
      </Card>
      {isNoFollow ? <NoFollowNote /> : null}
    </Stack>
  );
};
