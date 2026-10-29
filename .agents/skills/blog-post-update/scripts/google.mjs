// Search Console and GA4 over plain fetch: no googleapis dependency. Read-only scopes only.

import { createSign } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

export const SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly", "https://www.googleapis.com/auth/analytics.readonly"];
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const GSC_API = "https://searchconsole.googleapis.com/webmasters/v3";
const GA4_API = "https://analyticsdata.googleapis.com/v1beta";
const GA4_ADMIN_API = "https://analyticsadmin.googleapis.com/v1beta";
const GSC_ROW_LIMIT = 25_000;

export class GoogleError extends Error {}

const base64url = (value) => Buffer.from(value).toString("base64url");

/**
 * Which credentials are configured. A service account wins over a saved OAuth token, so a team
 * setup is never shadowed by someone's personal login.
 */
export const authMode = (env = process.env) => {
  const serviceAccount = env.GOOGLE_SERVICE_ACCOUNT_FILE || env.GOOGLE_APPLICATION_CREDENTIALS;
  if (serviceAccount) return { mode: "service-account", file: path.resolve(serviceAccount) };
  const client = env.GOOGLE_OAUTH_CLIENT_FILE;
  const token = path.resolve(env.GOOGLE_OAUTH_TOKEN_FILE || path.join(os.homedir(), ".config", "blog-post-update", "google-token.json"));
  if (client) return { mode: "oauth", client: path.resolve(client), token, authorised: existsSync(token) };
  return { mode: "none" };
};

const readJsonFile = (file, what) => {
  if (!existsSync(file)) throw new GoogleError(`${what} not found at ${file}`);
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    throw new GoogleError(`${what} at ${file} is not valid JSON`);
  }
};

const requestToken = async (body) => {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token)
    throw new GoogleError(`Google refused the token request: ${payload.error_description ?? payload.error ?? response.status}`);
  return payload;
};

const serviceAccountToken = async (file) => {
  const key = readJsonFile(file, "Service account key");
  if (!key.client_email || !key.private_key) throw new GoogleError(`${file} is not a service account key (no client_email/private_key)`);
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(JSON.stringify({ iss: key.client_email, scope: SCOPES.join(" "), aud: TOKEN_URL, iat: now, exp: now + 3600 }));
  const signature = createSign("RSA-SHA256").update(`${header}.${claims}`).sign(key.private_key, "base64url");
  const payload = await requestToken({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${header}.${claims}.${signature}` });
  return { token: payload.access_token, identity: key.client_email };
};

const oauthClient = (file) => {
  const raw = readJsonFile(file, "OAuth client file");
  const client = raw.installed ?? raw.web ?? raw;
  if (!client.client_id || !client.client_secret) throw new GoogleError(`${file} is not an OAuth client file (download it as "Desktop app")`);
  return client;
};

/** The desktop OAuth flow: prints a URL, waits for Google's redirect to a loopback port, saves a refresh token. */
export const authorise = async (mode, print = console.log) => {
  if (mode.mode !== "oauth") throw new GoogleError("Set GOOGLE_OAUTH_CLIENT_FILE to an OAuth client JSON (Desktop app) first.");
  const client = oauthClient(mode.client);
  let redirectUri = "";
  const code = await new Promise((resolve, reject) => {
    const server = http.createServer((request, response) => {
      const url = new URL(request.url ?? "/", redirectUri);
      const received = url.searchParams.get("code");
      const error = url.searchParams.get("error");
      if (!received && !error) {
        response.writeHead(404).end();
        return;
      }
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(error ? `<p>Google said: ${error}. Close this tab.</p>` : "<p>Authorised. Close this tab and go back to the terminal.</p>");
      setImmediate(() => server.close());
      if (error) reject(new GoogleError(`authorisation refused: ${error}`));
      else resolve(received);
    });
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      redirectUri = `http://127.0.0.1:${server.address().port}/`;
      const url = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
        client_id: client.client_id,
        redirect_uri: redirectUri,
        response_type: "code",
        access_type: "offline",
        prompt: "consent",
        scope: SCOPES.join(" "),
      })}`;
      print(`Open this URL in a browser, sign in with an account that can read the Search Console property and the GA4 property, and allow read-only access:\n\n${url}\n`);
    });
  });
  const payload = await requestToken({ client_id: client.client_id, client_secret: client.client_secret, code, grant_type: "authorization_code", redirect_uri: redirectUri });
  mkdirSync(path.dirname(mode.token), { recursive: true });
  writeFileSync(mode.token, JSON.stringify({ refresh_token: payload.refresh_token, access_token: payload.access_token, expiry: Date.now() + (payload.expires_in ?? 3600) * 1000 }, null, 2), { mode: 0o600 });
  return mode.token;
};

const oauthToken = async (mode) => {
  if (!existsSync(mode.token)) throw new GoogleError(`No saved Google token at ${mode.token}. Run the google-auth command once.`);
  const saved = readJsonFile(mode.token, "Saved token");
  if (saved.access_token && (saved.expiry ?? 0) > Date.now() + 60_000) return { token: saved.access_token, identity: "OAuth user" };
  if (!saved.refresh_token) throw new GoogleError(`The saved token has no refresh token. Delete ${mode.token} and run google-auth again.`);
  const client = oauthClient(mode.client);
  const payload = await requestToken({ client_id: client.client_id, client_secret: client.client_secret, refresh_token: saved.refresh_token, grant_type: "refresh_token" });
  writeFileSync(mode.token, JSON.stringify({ ...saved, access_token: payload.access_token, expiry: Date.now() + (payload.expires_in ?? 3600) * 1000 }, null, 2), { mode: 0o600 });
  return { token: payload.access_token, identity: "OAuth user" };
};

export const accessToken = async (mode) => {
  if (mode.mode === "service-account") return serviceAccountToken(mode.file);
  if (mode.mode === "oauth") return oauthToken(mode);
  throw new GoogleError("No Google credentials configured (see SKILL.md, step 0).");
};

const call = async (token, url, body) => {
  for (let attempt = 1, delay = 2000; ; attempt += 1, delay *= 2) {
    const response = await fetch(url, {
      method: body ? "POST" : "GET",
      headers: { authorization: `Bearer ${token}`, ...(body ? { "content-type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (response.ok) return response.json();
    if ((response.status === 429 || response.status >= 500) && attempt < 4) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }
    const text = await response.text().catch(() => "");
    const hint =
      response.status === 403
        ? url.includes("searchconsole")
          ? " The account needs access to this Search Console property (Settings → Users and permissions), and the Search Console API must be enabled in its Google Cloud project."
          : " The account needs at least the Viewer role on this GA4 property, and the Google Analytics Data API must be enabled in its Google Cloud project."
        : "";
    throw new GoogleError(`HTTP ${response.status} from ${new URL(url).hostname}: ${text.slice(0, 300)}${hint}`);
  }
};

export const listGscSites = async (token) => (await call(token, `${GSC_API}/sites`)).siteEntry ?? [];

export const listGa4Properties = async (token) => {
  const summaries = (await call(token, `${GA4_ADMIN_API}/accountSummaries?pageSize=200`)).accountSummaries ?? [];
  return summaries.flatMap((account) => (account.propertySummaries ?? []).map((property) => ({ property: property.property, name: property.displayName, account: account.displayName })));
};

/** Search Console rows for one dimension, optionally filtered to one page URL. */
export const gscQuery = async (token, { site, start, end, dimension, page }) => {
  const rows = [];
  for (let startRow = 0; ; startRow += GSC_ROW_LIMIT) {
    const body = {
      startDate: start,
      endDate: end,
      dimensions: [dimension],
      rowLimit: GSC_ROW_LIMIT,
      startRow,
      type: "web",
      dataState: "final",
      ...(page ? { dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "equals", expression: page }] }] } : {}),
    };
    const result = await call(token, `${GSC_API}/sites/${encodeURIComponent(site)}/searchAnalytics/query`, body);
    for (const row of result.rows ?? []) rows.push({ key: row.keys?.[0] ?? "", clicks: row.clicks ?? 0, impressions: row.impressions ?? 0, ctr: row.ctr ?? 0, position: row.position ?? null });
    if ((result.rows ?? []).length < GSC_ROW_LIMIT) break;
  }
  return rows;
};

const GA4_METRICS = [
  ["sessions", "sessions"],
  ["screenPageViews", "views"],
  ["activeUsers", "users"],
  ["engagementRate", "engagement_rate"],
  ["averageSessionDuration", "avg_session_seconds"],
  ["keyEvents", "key_events"],
];

/** GA4 landing-page metrics for one path (its trailing-slash variants included). */
export const ga4LandingPage = async (token, { property, start, end, pagePath }) => {
  const bare = pagePath.replace(/\/+$/, "") || "/";
  const values = [...new Set([pagePath, bare, `${bare}/`])];
  const result = await call(token, `${GA4_API}/${property}:runReport`, {
    dateRanges: [{ startDate: start, endDate: end }],
    dimensions: [{ name: "landingPage" }],
    metrics: GA4_METRICS.map(([name]) => ({ name })),
    dimensionFilter: { filter: { fieldName: "landingPage", inListFilter: { values } } },
    limit: 100,
  });
  const totals = Object.fromEntries(GA4_METRICS.map(([, name]) => [name, 0]));
  let sessions = 0;
  for (const row of result.rows ?? []) {
    const metrics = Object.fromEntries(GA4_METRICS.map(([, name], index) => [name, Number(row.metricValues?.[index]?.value ?? 0)]));
    // Rates and averages are session-weighted across the slash variants, not summed.
    for (const name of ["sessions", "views", "users", "key_events"]) totals[name] += metrics[name];
    totals.engagement_rate += metrics.engagement_rate * metrics.sessions;
    totals.avg_session_seconds += metrics.avg_session_seconds * metrics.sessions;
    sessions += metrics.sessions;
  }
  if (sessions) {
    totals.engagement_rate /= sessions;
    totals.avg_session_seconds /= sessions;
  }
  return { rows: (result.rows ?? []).length, totals };
};
