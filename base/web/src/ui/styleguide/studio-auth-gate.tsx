"use client";

import { createClient } from "next-sanity";
import { ReactNode, useEffect, useState } from "react";

import { dev } from "@/lib/env";
import { apiVersion, dataset, projectId } from "@/sanity/lib/env";

/**
 * Client-side gate for `/styleguide/*`. The server read-token is a robot token, so the
 * editor's identity comes from the browser via the project-scoped `/users/me`
 * (administrator or editor role required). Auth, tried in order:
 * 1. The Studio's own token: with `dual` login and third-party cookies blocked, Studio
 *    stores it in `localStorage` as `__studio_auth_token_<projectId>` (same origin as `/admin`).
 * 2. The session cookie (`withCredentials`): needs the route origin in the project's CORS
 *    origins with "Allow credentials".
 * A client gate only: the static HTML can still be fetched directly.
 */
type GateState = "checking" | "allowed" | "denied" | "error";

const ALLOWED_ROLES = ["administrator", "editor"];

const STUDIO_TOKEN_STORAGE_KEY = `__studio_auth_token_${projectId}`;

const cookieClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  withCredentials: true,
});

interface CurrentUser {
  role?: string;
  roles?: { name?: string }[];
}

const isAuthorized = (user: CurrentUser | null): boolean =>
  (user?.roles ?? []).some((role) => role.name && ALLOWED_ROLES.includes(role.name));

const readStudioToken = (): string | undefined => {
  try {
    const stored = window.localStorage.getItem(STUDIO_TOKEN_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as { token?: string }).token : undefined;
  } catch {
    return undefined;
  }
};

const fetchCurrentUser = (token?: string) =>
  (token
    ? cookieClient.withConfig({ token, useCdn: false, withCredentials: false })
    : cookieClient
  ).request<CurrentUser | null>({ uri: "/users/me" });

// A stale Studio token (logged out, expired) must not lock out a valid cookie
// session, so fall back to the cookie whenever the token doesn't grant access.
const checkAccess = async (): Promise<boolean> => {
  const studioToken = readStudioToken();
  if (studioToken) {
    const tokenUser = await fetchCurrentUser(studioToken).catch(() => null);
    if (isAuthorized(tokenUser)) return true;
  }
  return isAuthorized(await fetchCurrentUser());
};

const Centered = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-screen items-center justify-center p-8 text-center font-sans">
    <div className="max-w-md text-14 text-muted-foreground">{children}</div>
  </div>
);

export const StudioAuthGate = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<GateState>(dev ? "allowed" : "checking");

  useEffect(() => {
    if (dev) return;
    let active = true;
    checkAccess()
      .then((hasAccess) => {
        if (active) setState(hasAccess ? "allowed" : "denied");
      })
      .catch(() => {
        if (active) setState("error");
      });
    return () => {
      active = false;
    };
  }, []);

  if (state === "allowed") return <>{children}</>;

  if (state === "checking") {
    return <Centered>Verifying your Studio session…</Centered>;
  }

  if (state === "denied") {
    return (
      <Centered>
        <p className="font-medium text-foreground">Studio access required</p>
        <p className="mt-2">
          This page is available to Studio members with an editor or administrator role.
          Sign in to Studio with an authorized account to view it.
        </p>
      </Centered>
    );
  }

  return (
    <Centered>
      <p className="font-medium text-foreground">Couldn&apos;t verify your session</p>
      <p className="mt-2">
        Make sure you&apos;re signed in to Studio, and that this origin is allowed in the
        Sanity project&apos;s CORS settings with credentials enabled.
      </p>
    </Centered>
  );
};
