import {
  VscBook,
  VscFileSubmodule,
  VscMenu,
  VscServerProcess,
  VscUnmute,
} from "react-icons/vsc";
import { defineSingleton } from "sanity";

export const SINGLETON_BLOCKED_ACTIONS: string[] = ["delete", "unpublish"];

// Each `documentId` is the `_id` the web app queries by: changing one orphans the live document.
export const SINGLETONS = [
  defineSingleton({
    documentId: "blogListingPage",
    schemaType: "blog-listing-page",
    title: "Blog Listing Page",
    icon: VscBook,
  }),
  defineSingleton({
    documentId: "caseStudiesListingPage",
    schemaType: "case-studies-listing-page",
    title: "Case Studies Listing Page",
    icon: VscFileSubmodule,
  }),
  defineSingleton({
    documentId: "podcastListingPage",
    schemaType: "podcast-listing-page",
    title: "Podcast Page",
    icon: VscUnmute,
  }),
  defineSingleton({
    documentId: "header",
    schemaType: "header",
    title: "Header",
    icon: VscMenu,
  }),
  defineSingleton({
    documentId: "footer",
    schemaType: "footer",
    title: "Footer",
    icon: VscMenu,
  }),
  defineSingleton({
    documentId: "site",
    schemaType: "site",
    title: "Settings",
    icon: VscServerProcess,
  }),
];
