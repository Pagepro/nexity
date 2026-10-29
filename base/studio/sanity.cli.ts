import path from "path";
import { defineCliConfig } from "sanity/cli";
import svgr from "vite-plugin-svgr";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID!;
const dataset = process.env.SANITY_STUDIO_DATASET!;

export default defineCliConfig({
  api: {
    projectId,
    dataset,
  },
  vite: (config) => ({
    ...config,
    resolve: {
      ...config.resolve,
      alias: {
        ...(config.resolve?.alias instanceof Array ? {} : (config.resolve?.alias ?? {})),
        "@": path.resolve("./src"),
      },
    },
    plugins: [...(config.plugins ?? []), svgr({ include: /\.svg(\?.*)?$/ })],
  }),
});
