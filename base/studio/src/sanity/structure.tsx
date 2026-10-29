import { contextDocumentTypeName } from "@sanity/assist";
import { VscFiles } from "react-icons/vsc";
import { structureTool } from "sanity/structure";

import {
  createDocumentListWithPreview,
  createDocumentListWithSlugPrefix,
  createSingletonWithPreview,
} from "./lib/structure";

export const structure = structureTool({
  structure: (S) =>
    S.list()
      .title("Content")
      .items([
        createDocumentListWithPreview(S, {
          title: "Pages",
          type: "page",
          icon: VscFiles,
        }),
        S.divider().title("Blog"),
        createSingletonWithPreview(S, { id: "blogListingPage", previewSlug: "/blog" }),
        S.listItem()
          .title("Posts")
          .schemaType("post")
          .child(
            createDocumentListWithSlugPrefix(S, {
              title: "Posts",
              type: "post",
              slugPrefix: "/blog",
            }),
          ),
        S.divider().title("Case studies"),
        createSingletonWithPreview(S, {
          id: "caseStudiesListingPage",
          previewSlug: "/case-studies",
        }),
        S.listItem()
          .title("Case studies")
          .schemaType("case-study")
          .child(
            createDocumentListWithSlugPrefix(S, {
              title: "Case studies",
              type: "case-study",
              slugPrefix: "/case-studies",
            }),
          ),
        S.divider().title("Podcast"),
        createSingletonWithPreview(S, {
          id: "podcastListingPage",
          previewSlug: "/podcast",
        }),
        S.listItem()
          .title("Episodes")
          .schemaType("podcast-episode")
          .child(
            createDocumentListWithSlugPrefix(S, {
              title: "Episodes",
              type: "podcast-episode",
              slugPrefix: "/podcast",
            }),
          ),
        S.divider().title("Sections"),
        S.documentTypeListItem("global-section").title("Global Sections"),
        S.documentTypeListItem("shared-section").title("Shared Sections"),
        S.divider().title("Collections"),
        S.documentTypeListItem("testimonial").title("Testimonials"),
        S.documentTypeListItem("author").title("Authors"),
        S.documentTypeListItem("integration").title("Integrations"),
        S.divider().title("Configuration"),
        S.listItem().singleton("header"),
        S.listItem().singleton("footer"),
        S.listItem().singleton("site"),
        S.documentTypeListItem("redirect").title("Redirects"),
        S.documentTypeListItem("rewrite").title("Rewrites"),
        S.documentTypeListItem(contextDocumentTypeName),
      ]),
});
