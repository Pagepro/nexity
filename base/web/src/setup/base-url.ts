/** `next.config.ts` inlines the result as `NEXT_PUBLIC_BASE_URL`; the rest of the app reads that variable. */
export const resolveBaseUrl = (
  env: Record<string, string | undefined> = process.env,
): string => {
  const explicitUrl = env.NEXT_PUBLIC_BASE_URL?.trim();

  if (explicitUrl) return explicitUrl;

  const vercelHost =
    env.VERCEL_ENV === "production" ? env.VERCEL_PROJECT_PRODUCTION_URL : env.VERCEL_URL;

  if (vercelHost) return `https://${vercelHost}`;

  return "http://localhost:3000";
};
