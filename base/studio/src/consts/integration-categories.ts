// Shared with the web Integrations grid: order here is its tab order.
export const INTEGRATION_CATEGORIES = [
  { title: "CRM", value: "crm" },
  { title: "Comms", value: "comms" },
  { title: "Data", value: "data" },
  { title: "Marketing", value: "marketing" },
  { title: "Support", value: "support" },
] as const;

export type IntegrationCategoryValue = (typeof INTEGRATION_CATEGORIES)[number]["value"];
