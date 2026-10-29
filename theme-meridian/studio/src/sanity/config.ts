import { assist } from "@sanity/assist";
import { codeInput } from "@sanity/code-input";
import { dashboardTool, projectInfoWidget, projectUsersWidget } from "@sanity/dashboard";
import { table } from "@sanity/table";
import { visionTool } from "@sanity/vision";
import { VscSymbolColor } from "react-icons/vsc";
import { defineConfig, type DocumentPluginOptions } from "sanity";
import { vercelWidget } from "sanity-plugin-dashboard-widget-vercel";
import { media } from "sanity-plugin-media";
import { simplerColorInput } from "sanity-plugin-simpler-color-input";

import { presentation } from "./presentation";
import { schemaTypes } from "./schemaTypes";
import { SINGLETON_BLOCKED_ACTIONS, SINGLETONS } from "./singletons";
import { structure } from "./structure";
import { StyleguideTool } from "./ui/StyleguideTool";
import "./schemaTypes/objects/richText/editor.css";

interface SanityConfigOptions {
  projectId: string;
  dataset: string;
  apiVersion: string;
  basePath: string;
  productionUrl?: DocumentPluginOptions["productionUrl"];
}

export const createSanityConfig = ({
  projectId,
  dataset,
  apiVersion,
  basePath,
  productionUrl,
}: SanityConfigOptions) =>
  defineConfig({
    title: "Meridian",
    projectId,
    dataset,
    basePath,

    plugins: [
      structure,
      presentation,
      media(),
      dashboardTool({
        name: "deployment",
        title: "Deployment",
        widgets: [vercelWidget()],
      }),
      dashboardTool({
        name: "info",
        title: "Info",
        widgets: [projectInfoWidget(), projectUsersWidget()],
      }),
      visionTool({ defaultApiVersion: apiVersion }),
      assist(),
      codeInput(),
      table(),
      simplerColorInput({
        defaultColorFormat: "rgba",
        defaultColorList: [
          { label: "White", value: "#ffffff" },
          { label: "Primary", value: "#DE473C" },
          { label: "Secondary", value: "#0056AF" },
          { label: "Secondary Foreground", value: "#B9E2FE" },
          { label: "Custom...", value: "custom" },
        ],
        enableSearch: true,
      }),
    ],

    tools: (prev) => [
      ...prev,
      {
        name: "styleguide",
        title: "Styleguide",
        icon: VscSymbolColor,
        component: StyleguideTool,
      },
    ],

    schema: {
      types: schemaTypes,
    },
    document: {
      productionUrl,
      singletons: SINGLETONS,
      // Native singletons only drop `duplicate`; a deleted or unpublished singleton breaks the production build.
      actions: (prev, context) =>
        context.singleton
          ? prev.filter(
              ({ action }) => !action || !SINGLETON_BLOCKED_ACTIONS.includes(action),
            )
          : prev,
    },
  });
