"use client";

import groq from "groq";
import { defineDocuments, defineLocations, presentationTool } from "sanity/presentation";

import { PREVIEW_URL_PREFIX } from "./lib/preview-origin";

const ensureLeadingSlash = (s: string) => (s.startsWith("/") ? s : `/${s}`);

export const presentation = presentationTool({
  name: "editor",
  title: "Editor",
  allowOrigins: ["http://localhost:3000", "http://localhost:*"],
  previewUrl: {
    previewMode: {
      enable: `${PREVIEW_URL_PREFIX}/api/draft-mode/enable`,
    },
  },
  resolve: {
    mainDocuments: defineDocuments([
      {
        route: "/blog",
        filter: groq`_type == 'blog-listing-page' && _id == 'blogListingPage'`,
      },
      {
        route: "/case-studies",
        filter: groq`_type == 'case-studies-listing-page' && _id == 'caseStudiesListingPage'`,
      },
      {
        route: "/podcast",
        filter: groq`_type == 'podcast-listing-page' && _id == 'podcastListingPage'`,
      },
      {
        route: "/:slug",
        filter: groq`_type == 'page' && metadata.slug.current == $slug`,
      },
      {
        route: "/blog/:slug",
        filter: groq`_type == 'post' && metadata.slug.current == $slug`,
      },
      {
        route: "/case-studies/:slug",
        filter: groq`_type == 'case-study' && metadata.slug.current == $slug`,
      },
      {
        route: "/podcast/:slug",
        filter: groq`_type == 'podcast-episode' && metadata.slug.current == $slug`,
      },
    ]),
    locations: {
      header: defineLocations({
        message: "Header is used on all pages",
        locations: [
          {
            title: "Home",
            href: "/",
          },
        ],
      }),
      footer: defineLocations({
        message: "Footer is used on all pages",
        locations: [
          {
            title: "Home",
            href: "/",
          },
        ],
      }),
      "blog-listing-page": defineLocations({
        message: "Blog listing page",
        locations: [
          {
            title: "Blog",
            href: "/blog",
          },
        ],
      }),
      post: defineLocations({
        select: {
          title: "metadata.title",
          slug: "metadata.slug.current",
        },
        resolve: (doc) => ({
          locations: [
            {
              title: doc?.title || "Untitled",
              href: doc?.slug ? `/blog/${doc.slug}` : "#",
            },
            {
              title: "All Posts",
              href: "/blog",
            },
          ],
        }),
      }),
      "case-studies-listing-page": defineLocations({
        message: "Case studies listing page",
        locations: [
          {
            title: "Case studies",
            href: "/case-studies",
          },
        ],
      }),
      "case-study": defineLocations({
        select: {
          title: "metadata.title",
          slug: "metadata.slug.current",
        },
        resolve: (doc) => ({
          locations: [
            {
              title: doc?.title || "Untitled",
              href: doc?.slug ? `/case-studies/${doc.slug}` : "#",
            },
            {
              title: "All case studies",
              href: "/case-studies",
            },
          ],
        }),
      }),
      "podcast-listing-page": defineLocations({
        message: "Podcast page",
        locations: [
          {
            title: "Podcast",
            href: "/podcast",
          },
        ],
      }),
      "podcast-episode": defineLocations({
        select: {
          title: "metadata.title",
          slug: "metadata.slug.current",
        },
        resolve: (doc) => ({
          locations: [
            {
              title: doc?.title || "Untitled",
              href: doc?.slug ? `/podcast/${doc.slug}` : "#",
            },
            {
              title: "All episodes",
              href: "/podcast",
            },
          ],
        }),
      }),
      page: defineLocations({
        select: {
          title: "title",
          metaTitle: "metadata.title",
          slug: "metadata.slug.current",
        },
        resolve: (doc) => ({
          locations: [
            {
              title: doc?.title || doc?.metaTitle || "Untitled",
              href: doc?.slug ? ensureLeadingSlash(doc.slug) : "#",
            },
          ],
        }),
      }),
    },
  },
});
