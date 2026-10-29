// `value` MUST match studio/.../documents/post.ts (category.options.list).
// `value: ""` is the "all" pseudo-category (disables the GROQ category filter).
export const CATEGORIES = [
  { slug: "all", label: "All articles", value: "" },
  { slug: "win-loss", label: "Win/loss", value: "Win/loss" },
  { slug: "research-report", label: "Research report", value: "Research report" },
  { slug: "content-strategy", label: "Content strategy", value: "Content strategy" },
  { slug: "product-updates", label: "Product updates", value: "Product updates" },
] as const;

export const POSTS_PER_PAGE = 6;

export const LISTING_HEADING = "Latest articles";
