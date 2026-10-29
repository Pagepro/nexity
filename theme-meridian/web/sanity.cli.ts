import { defineCliConfig } from "sanity/cli";

import { projectId, dataset } from "@/sanity/lib/env";

export default defineCliConfig({
  api: {
    projectId,
    dataset,
  },
  typegen: {
    generates: "./src/types/sanity.types.ts",
  },
});
