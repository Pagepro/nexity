/**
 * The links that the article already carries.
 *
 * A live run proposed a source for a sentence that already linked to the very
 * same page. The report gave an editor no way to tell that case from a sentence
 * with no source at all.
 */

import { describe, expect, it } from "vitest";

import { hostOf, isExternalLink, linksInSpan, readLinks, sameHost } from "../src/links.js";

const ARTICLE = "https://pagepro.co/blog/migration-from-drupal-to-headless-cms";

const HTML = [
  "<html><body>",
  "<nav><a href='https://pagepro.co/services'>Our services</a></nav>",
  "<main>",
  "<p>Drupal 7 security support ended on ",
  "<a href='https://www.drupal.org/psa-2025-01-06'>5 January 2025</a>, so a site has to move.</p>",
  "<p>We also wrote about <a href='https://pagepro.co/blog/headless-cms'>headless basics</a> before.</p>",
  "</main></body></html>",
].join("");

// The extractor drops the navigation, so the text starts at the first sentence.
const TEXT =
  "Drupal 7 security support ended on 5 January 2025, so a site has to move." +
  "We also wrote about headless basics before.";

describe("the links of the article", () => {
  it("reads a link of the body with its place in the text", () => {
    const links = readLinks(HTML, TEXT);
    expect(links.map((link) => link.href)).toEqual([
      "https://www.drupal.org/psa-2025-01-06",
      "https://pagepro.co/blog/headless-cms",
    ]);
    expect(links[0]!.text).toBe("5 January 2025");
    expect(TEXT.slice(links[0]!.start, links[0]!.start + 14)).toBe("5 January 2025");
  });

  it("drops a navigation link, because its words are not in the text", () => {
    const links = readLinks(HTML, TEXT);
    expect(links.some((link) => link.href.endsWith("/services"))).toBe(false);
  });

  it("returns the links inside the sentence of a claim", () => {
    const links = readLinks(HTML, TEXT);
    const span = { start: 0, end: TEXT.indexOf("We also") };
    expect(linksInSpan(links, span).map((link) => link.href)).toEqual([
      "https://www.drupal.org/psa-2025-01-06",
    ]);
    expect(linksInSpan(links, null)).toEqual([]);
  });

  it("counts a link to the same site as internal linking, never as a source", () => {
    expect(isExternalLink("https://www.drupal.org/psa-2025-01-06", ARTICLE)).toBe(true);
    expect(isExternalLink("https://pagepro.co/blog/headless-cms", ARTICLE)).toBe(false);
    // www never decides.
    expect(isExternalLink("https://www.pagepro.co/blog/x", ARTICLE)).toBe(false);
  });

  it("compares hosts without the www label", () => {
    expect(hostOf("https://www.sanity.io/docs")).toBe("sanity.io");
    expect(sameHost("https://www.sanity.io/docs", "https://sanity.io/pricing")).toBe(true);
    expect(sameHost("https://sanity.io", "https://contentful.com")).toBe(false);
    expect(sameHost("not a url", "https://sanity.io")).toBe(false);
  });
});

describe("the links of a real page layout", () => {
  // A live run read the tag list of the sidebar. The tag "Expo" landed inside
  // the word "Export", and "Sanity" landed on an unrelated sentence.
  const body =
    "The built-in Tools > Export function generates an XML file covering posts and pages. " +
    "Sanity loads NDJSON files with its datasets import command, as the " +
    "<a href='https://www.sanity.io/docs/cli-reference/cli-datasets'>datasets reference</a> states. " +
    "A migration needs a URL map and permanent redirects for every old address.";
  const html =
    "<html><body><main><article><p>" + body + "</p></article></main>" +
    "<aside><a href='https://pagepro.co/blog/category/expo/'>Expo</a>" +
    "<a href='https://pagepro.co/blog/category/sanity/'>Sanity</a></aside></body></html>";
  const text = body.replace(/<[^>]+>/g, "");

  it("reads only the anchors of the main content", () => {
    const links = readLinks(html, text);
    expect(links.map((link) => link.href)).toEqual([
      "https://www.sanity.io/docs/cli-reference/cli-datasets",
    ]);
  });

  it("never matches an anchor inside a longer word", () => {
    const loose =
      "<html><body><main><p>" + "x".repeat(210) + " <a href='https://expo.dev/'>Expo</a></p></main></body></html>";
    const links = readLinks(loose, `The Export button. ${"x".repeat(210)} Expo`);
    expect(links).toHaveLength(1);
    expect(links[0]!.start).toBeGreaterThan(20);
  });
});
