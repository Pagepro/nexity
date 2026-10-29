import type { IntegrationCategoryValue } from "@/consts/integration-categories";
import type { ExtractSectionProps } from "@/types/sections";

const integration = (id: string, name: string, category: IntegrationCategoryValue) => ({
  _id: `gallery-integration-${id}`,
  name,
  category,
  logo: null,
});

export const integrationsGridFixture = {
  _type: "integrations-grid",
  _key: "gallery-fixture-integrations-grid",
  pretitle: "Integrations",
  content: [
    {
      _type: "block",
      _key: "heading",
      style: "section-heading-lg",
      children: [
        {
          _type: "span",
          _key: "heading-span",
          text: "Works with your entire stack.",
          marks: [],
        },
      ],
    },
    {
      _type: "block",
      _key: "description",
      style: "body-3",
      children: [
        {
          _type: "span",
          _key: "description-span",
          text: "40+ native integrations. Two-way sync, no engineering required.",
          marks: [],
        },
      ],
    },
  ],
  source: "manual",
  allLabel: "All",
  searchPlaceholder: "Search integrations",
  emptyMessage: "No integrations match your search.",
  integrations: [
    integration("cumulo", "Cumulo", "crm"),
    integration("harborline", "Harborline", "crm"),
    integration("relay", "Relay", "comms"),
    integration("parley", "Parley", "comms"),
    integration("frostbase", "Frostbase", "data"),
    integration("outpost-mail", "Outpost Mail", "marketing"),
    integration("foliobase", "Foliobase", "marketing"),
    integration("porchlight", "Porchlight", "support"),
  ],
  ctas: null,
} satisfies ExtractSectionProps<"integrations-grid">;
