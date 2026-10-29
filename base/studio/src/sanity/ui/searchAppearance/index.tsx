import { createImageUrlBuilder } from "@sanity/image-url";
import { Stack } from "@sanity/ui";
import { useEffect, useMemo, useState } from "react";
import { type ObjectInputProps, useClient, useFormValue } from "sanity";

import { buildSeoDescription, buildSeoTitle } from "../../lib/seo-title";

import type { Device } from "./constants";
import { type PreviewStatus, SearchAppearancePreview } from "./preview";
import {
  formatBreadcrumb,
  formatSerpDate,
  resolveStudioUrl,
  truncateDescription,
  truncateTitle,
} from "./utils";

const API_VERSION = process.env.SANITY_STUDIO_API_VERSION || "2024-12-01";

// A standalone Studio sets the site origin with SANITY_STUDIO_APP_URL.
const BASE_URL = (
  process.env.SANITY_STUDIO_APP_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  ""
).replace(/\/+$/, "");

interface MetadataValue {
  title?: string;
  seoTitle?: string;
  description?: string;
  slug?: { current?: string };
  canonical?: string;
  noIndex?: boolean;
  noFollow?: boolean;
}

interface SiteSettings {
  title?: string;
  logo?: { image?: { asset?: { _ref?: string } } };
  seo?: { title?: string; description?: string };
}

type SiteState = "loading" | "ready" | "error";

// Published only: the rendered site reads the published document.
const SITE_QUERY = `*[_type == "site" && !(_id in path("drafts.**"))][0]{ title, logo, seo }`;

// Uses the same buildSeoTitle / buildSeoDescription as the web metadata builders.
// Never re-implement the precedence here.
export const SearchAppearanceInput = (props: ObjectInputProps) => {
  const metadata = (props.value ?? {}) as MetadataValue;

  const documentType = useFormValue(["_type"]) as string | undefined;
  const documentTitle = useFormValue(["title"]) as string | undefined;
  const excerpt = useFormValue(["excerpt"]) as string | undefined;
  const publishedAt = useFormValue(["publishedAt"]) as string | undefined;

  const client = useClient({ apiVersion: API_VERSION });

  const [site, setSite] = useState<SiteSettings | null>(null);
  const [siteState, setSiteState] = useState<SiteState>("loading");

  useEffect(() => {
    let isActive = true;
    client
      .fetch<SiteSettings | null>(SITE_QUERY)
      .then((result) => {
        if (!isActive) return;
        setSite(result);
        setSiteState("ready");
      })
      .catch(() => {
        if (!isActive) return;
        setSite(null);
        setSiteState("error");
      });
    return () => {
      isActive = false;
    };
  }, [client]);

  const [device, setDevice] = useState<Device>("desktop");

  const metaTitle = metadata.title;
  const metaSeoTitle = metadata.seoTitle;
  const metaDescription = metadata.description;
  const metaSlug = metadata.slug?.current;
  const metaCanonical = metadata.canonical;

  const view = useMemo(() => {
    const rawTitle = buildSeoTitle({
      metadata: { title: metaTitle, seoTitle: metaSeoTitle },
      documentTitle,
      site,
    });
    const rawDescription = buildSeoDescription({
      metadataDescription: metaDescription,
      excerpt,
      site,
    });

    let faviconUrl: string | undefined;
    if (BASE_URL) {
      faviconUrl = `${BASE_URL}/favicon.ico`;
    } else if (site?.logo?.image?.asset?._ref) {
      faviconUrl = createImageUrlBuilder(client)
        .image(site.logo.image)
        .width(52)
        .height(52)
        .fit("crop")
        .url();
    }

    const resolvedPath = resolveStudioUrl({
      type: documentType,
      metadataSlug: metaSlug,
      canonical: metaCanonical,
    });

    return {
      siteName: site?.title || "",
      faviconUrl,
      breadcrumb: formatBreadcrumb(BASE_URL, resolvedPath),
      title: truncateTitle(rawTitle, device),
      description: truncateDescription(rawDescription, device),
      date: formatSerpDate(publishedAt),
    };
  }, [
    client,
    device,
    documentTitle,
    documentType,
    excerpt,
    metaCanonical,
    metaDescription,
    metaSeoTitle,
    metaSlug,
    metaTitle,
    publishedAt,
    site,
  ]);

  let status: PreviewStatus = "ready";
  if (metadata.noIndex) status = "noindex";
  else if (siteState === "loading") status = "loading";

  return (
    <Stack gap={4}>
      <SearchAppearancePreview
        {...view}
        device={device}
        onDeviceChange={setDevice}
        status={status}
        isNoFollow={Boolean(metadata.noFollow)}
      />
      {props.renderDefault(props)}
    </Stack>
  );
};
