/**
 * Page download.
 *
 * This module is a port of the `PageFetcher` class in
 * `src/claim_source_reviewer/pipeline/fetch.py`.
 *
 * The module never raises on a network fault. A failure returns a status and a
 * cause, so the run continues and the report states what happened. A batch run
 * must not stop because one host is down.
 */

import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

import {
  ALLOWED_CONTENT_TYPES,
  challengeName,
  extractMainText,
  looksLikeChallenge,
  statusOf,
} from "./fetch.js";
import { FetchStatus } from "./models.js";
import { readDates } from "./dates.js";
import { normalizeWs } from "./textops.js";

/** The agent that the fetcher reports to a host. */
export const USER_AGENT =
  "Mozilla/5.0 (compatible; ClaimSourceReviewer/1.0)";

export const DEFAULT_TIMEOUT_MS = 20000;
export const DEFAULT_RETRIES = 2;
export const MIN_PAGE_CHARS = 400;

/** The largest body that the fetcher reads. A larger body is truncated. */
export const MAX_BODY_BYTES = 4_000_000;

export interface FetchOptions {
  timeoutMs?: number;
  retries?: number;
  minPageChars?: number;
}

export interface FetchedPage {
  url: string;
  /** The address after every redirect. */
  finalUrl: string;
  status: FetchStatus;
  detail: string;
  httpStatus: number | null;
  title: string;
  text: string;
  /** The body as the host returned it. The section reader needs the markup. */
  html: string;
  /** The publication date that the page states, or `null`. */
  publishedAt: Date | null;
  /**
   * The modification date that the page states.
   *
   * The `Last-Modified` header is the fallback, never the first answer.
   */
  modifiedAt: Date | null;
}

/**
 * Read the text of a PDF.
 *
 * A vendor publishes a specification, a release note, or a price list as a
 * PDF. The reviewer used to refuse the whole type, so a run lost every such
 * page and reported no source for a claim the PDF answers.
 *
 * A PDF that carries no text layer, a scan, returns an empty string. The
 * caller then classifies the page as too short, which is the honest answer.
 */
export async function extractPdfText(bytes: Uint8Array): Promise<string> {
  // A PDF must never fetch or run anything of its own.
  const task = getDocument({ data: bytes, useSystemFonts: false, disableFontFace: true });
  try {
    const pdf = await task.promise;
    const pages: string[] = [];
    for (let number = 1; number <= pdf.numPages; number += 1) {
      const page = await pdf.getPage(number);
      const content = await page.getTextContent();
      const line = content.items
        .map((item) => (typeof item === "object" && item && "str" in item ? String(item.str) : ""))
        .join(" ");
      pages.push(line);
    }
    return normalizeWs(pages.join(" "));
  } catch {
    // A broken or protected file must not stop the run.
    return "";
  } finally {
    await task.destroy().catch(() => undefined);
  }
}

/** Return true when the status invites another attempt. */
function isRetryable(httpStatus: number): boolean {
  return httpStatus === 429 || httpStatus >= 500;
}

function failure(url: string, status: FetchStatus, detail: string, httpStatus: number | null): FetchedPage {
  return {
    url,
    finalUrl: url,
    status,
    detail,
    httpStatus,
    title: "",
    text: "",
    html: "",
    publishedAt: null,
    modifiedAt: null,
  };
}

/** Wait for the given time. The retry pause grows with the attempt. */
function pause(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Download one page and extract its text.
 *
 * The function returns a `FetchedPage` in every case. It never throws.
 */
export async function fetchPage(url: string, options: FetchOptions = {}): Promise<FetchedPage> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = options.retries ?? DEFAULT_RETRIES;
  const minChars = options.minPageChars ?? MIN_PAGE_CHARS;

  let lastDetail = "The host gave no answer.";
  let lastHttpStatus: number | null = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    if (attempt > 0) await pause(500 * attempt);

    const control = new AbortController();
    const timer = setTimeout(() => control.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        redirect: "follow",
        signal: control.signal,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml,text/markdown,text/plain;q=0.9,*/*;q=0.8",
          "Accept-Language": "en",
        },
      });
      lastHttpStatus = response.status;

      if (!response.ok) {
        // Read the body before judging the status. A host behind a browser
        // check answers 429 or 403 and still sends a challenge page, and the
        // status alone then reads as "the server is busy", which sends a
        // person off to wait for something that will never change.
        const failedBody = await response.text().catch(() => "");
        if (looksLikeChallenge(failedBody)) {
          const name = challengeName(failedBody);
          return failure(
            url,
            FetchStatus.BLOCKED,
            `The host runs a browser check${name ? ` (${name})` : ""} and answered HTTP ` +
              `${response.status}. A plain HTTP client cannot pass it, and no retry will. ` +
              "Open the page in a browser to read it.",
            response.status,
          );
        }

        lastDetail = `The host answered with HTTP ${response.status}.`;
        if (isRetryable(response.status) && attempt < retries) continue;
        const status =
          response.status === 401 || response.status === 402 || response.status === 403
            ? FetchStatus.BLOCKED
            : FetchStatus.HTTP_ERROR;
        return failure(url, status, lastDetail, response.status);
      }

      const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
      const isPdf = contentType.includes("application/pdf");
      if (contentType && !isPdf && !ALLOWED_CONTENT_TYPES.some((allowed) => contentType.includes(allowed))) {
        return failure(
          url,
          FetchStatus.UNSUPPORTED_TYPE,
          `The host returned ${contentType}. The reviewer reads text and PDF.`,
          response.status,
        );
      }

      const buffer = await response.arrayBuffer();
      if (isPdf) {
        const text = await extractPdfText(
          new Uint8Array(buffer.byteLength > MAX_BODY_BYTES ? buffer.slice(0, MAX_BODY_BYTES) : buffer),
        );
        const name = new URL(response.url || url).pathname.split("/").pop() ?? "";
        return {
          url,
          finalUrl: response.url || url,
          status:
            text.length >= minChars
              ? FetchStatus.OK
              : FetchStatus.TOO_SHORT,
          detail:
            text.length >= minChars
              ? ""
              : `The PDF gave ${text.length} characters. It may be a scan with no text layer.`,
          httpStatus: response.status,
          title: name || "PDF document",
          text,
          html: "",
          publishedAt: null,
          modifiedAt: readDates("", response.headers.get("last-modified")).modifiedAt,
        };
      }
      const body = new TextDecoder("utf-8", { fatal: false }).decode(
        buffer.byteLength > MAX_BODY_BYTES ? buffer.slice(0, MAX_BODY_BYTES) : buffer,
      );
      const { title, text } = extractMainText(body);
      const { status, detail } = statusOf(body, text, minChars);
      const dates = readDates(body, response.headers.get("last-modified"));

      return {
        url,
        finalUrl: response.url || url,
        status,
        detail,
        httpStatus: response.status,
        title,
        text,
        html: body,
        publishedAt: dates.publishedAt,
        modifiedAt: dates.modifiedAt,
      };
    } catch (error) {
      const name = error instanceof Error ? error.name : "Error";
      const timedOut = name === "AbortError" || name === "TimeoutError";
      lastDetail = timedOut
        ? `The host did not answer within ${timeoutMs} ms.`
        : `The request failed: ${error instanceof Error ? error.message : String(error)}`;
      if (attempt < retries) continue;
      return failure(
        url,
        timedOut ? FetchStatus.TIMEOUT : FetchStatus.HTTP_ERROR,
        lastDetail,
        lastHttpStatus,
      );
    } finally {
      clearTimeout(timer);
    }
  }

  return failure(url, FetchStatus.HTTP_ERROR, lastDetail, lastHttpStatus);
}
