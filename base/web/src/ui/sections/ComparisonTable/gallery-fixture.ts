import type { ExtractSectionProps } from "@/types/sections";

const externalLink = (label: string) => ({
  _type: "link" as const,
  type: "external" as const,
  external: "https://example.com",
  internalPath: null,
  internal: null,
  file: null,
  params: null,
  label,
});

export const comparisonTableFixture = {
  _type: "comparison-table",
  _key: "gallery-fixture-comparison-table",
  pretitle: "Pricing",
  content: [
    {
      _type: "block",
      _key: "heading",
      style: "section-heading-lg",
      children: [
        {
          _type: "span",
          _key: "heading-span",
          text: "Compare every feature",
          marks: [],
        },
      ],
    },
    {
      _type: "block",
      _key: "body",
      style: "body-3",
      children: [
        {
          _type: "span",
          _key: "body-span",
          text: "Every plan, side by side. Pick the one that fits how your team works.",
          marks: [],
        },
      ],
    },
  ],
  plans: [
    {
      _key: "plan-starter",
      name: "Starter",
      logo: null,
      price: "$49",
      priceSuffix: "/mo",
      featured: "default",
      cta: {
        variant: "primary-outline",
        buttonIcon: null,
        link: externalLink("Get started"),
      },
    },
    {
      _key: "plan-growth",
      name: "Growth",
      logo: null,
      price: "$249",
      priceSuffix: "/mo",
      featured: "featured",
      cta: {
        variant: "primary",
        buttonIcon: null,
        link: externalLink("Start free trial"),
      },
    },
    {
      _key: "plan-enterprise",
      name: "Enterprise",
      logo: null,
      price: "Custom",
      priceSuffix: null,
      featured: "default",
      cta: {
        variant: "primary-outline",
        buttonIcon: null,
        link: externalLink("Contact sales"),
      },
    },
  ],
  featureGroups: [
    {
      _key: "group-attribution",
      title: "Attribution",
      description: "Connect every touchpoint to revenue.",
      rows: [
        {
          _key: "row-lookback",
          label: "Lookback window",
          hint: null,
          cells: [
            { _key: "c1", state: "text", value: "30 days", values: null },
            { _key: "c2", state: "text", value: "90 days", values: null },
            { _key: "c3", state: "text", value: "Unlimited", values: null },
          ],
        },
        {
          _key: "row-multitouch",
          label: "Multi-touch attribution",
          hint: "Distributes credit across every touchpoint in the customer journey, not just the last click.",
          cells: [
            { _key: "c1", state: "excluded", value: null, values: null },
            { _key: "c2", state: "included", value: null, values: null },
            { _key: "c3", state: "included", value: null, values: null },
          ],
        },
      ],
    },
    {
      _key: "group-dashboards",
      title: "Dashboards & reporting",
      description: "See what's working at a glance.",
      rows: [
        {
          _key: "row-dashboards",
          label: "Custom dashboards",
          hint: null,
          cells: [
            { _key: "c1", state: "excluded", value: null, values: null },
            { _key: "c2", state: "included", value: null, values: null },
            { _key: "c3", state: "included", value: "Unlimited", values: null },
          ],
        },
        {
          _key: "row-reports",
          label: "Scheduled reports",
          hint: null,
          cells: [
            { _key: "c1", state: "included", value: null, values: null },
            { _key: "c2", state: "included", value: null, values: null },
            { _key: "c3", state: "included", value: null, values: null },
          ],
        },
      ],
    },
    {
      _key: "group-integrations",
      title: "Integrations",
      description: "Plug into the tools you already use.",
      rows: [
        {
          _key: "row-crm",
          label: "CRM sync",
          hint: null,
          cells: [
            { _key: "c1", state: "excluded", value: null, values: null },
            { _key: "c2", state: "included", value: "Salesforce, HubSpot", values: null },
            {
              _key: "c3",
              state: "included",
              value: "Salesforce, HubSpot, Segment",
              values: null,
            },
          ],
        },
        {
          _key: "row-connectors",
          label: "Connectors",
          hint: null,
          cells: [
            {
              _key: "c1",
              state: "list",
              value: null,
              values: ["Salesforce", "HubSpot", "Marketo"],
            },
            {
              _key: "c2",
              state: "list",
              value: null,
              values: [
                "Salesforce",
                "HubSpot",
                "Marketo",
                "Segment",
                "Snowflake",
                "BigQuery",
              ],
            },
            {
              _key: "c3",
              state: "list",
              value: null,
              values: [
                "Salesforce",
                "HubSpot",
                "Marketo",
                "Segment",
                "Snowflake",
                "BigQuery",
                "Redshift",
                "Custom",
              ],
            },
          ],
        },
        {
          _key: "row-api",
          label: "API access",
          hint: "REST and webhook access with a generous rate limit.",
          cells: [
            { _key: "c1", state: "addon", value: null, values: null },
            { _key: "c2", state: "included", value: null, values: null },
            { _key: "c3", state: "included", value: null, values: null },
          ],
        },
      ],
    },
  ],
  footnote: "* Caveats and other conditions apply. Prices shown in USD.",
} satisfies ExtractSectionProps<"comparison-table">;
