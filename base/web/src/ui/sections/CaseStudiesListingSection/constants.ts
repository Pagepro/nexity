// `value` MUST match studio/.../documents/case-study.ts (category.options.list).
// `value: ""` is the "all" pseudo-category (disables the GROQ category filter).
export const CATEGORIES = [
  { slug: "all", label: "All", value: "" },
  { slug: "fintech", label: "Fintech", value: "Fintech" },
  { slug: "healthcare", label: "Healthcare", value: "Healthcare" },
  { slug: "ecommerce", label: "E-commerce", value: "E-commerce" },
  { slug: "saas", label: "SaaS", value: "SaaS" },
  { slug: "manufacturing", label: "Manufacturing", value: "Manufacturing" },
  { slug: "logistics", label: "Logistics", value: "Logistics" },
  { slug: "other", label: "Other", value: "Other" },
] as const;

export const CASE_STUDIES_PER_PAGE = 6;

export const LISTING_HEADING = "Case studies";
