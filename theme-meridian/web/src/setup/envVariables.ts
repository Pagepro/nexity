import { z } from "zod";

import { resolveBaseUrl } from "./base-url";
import { getMissingRecommendedEnv } from "./env-recommendations";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).optional(),

  // Always present: filled with `resolveBaseUrl()`, the fallback `next.config.ts` inlines.
  NEXT_PUBLIC_BASE_URL: z
    .string()
    .url()
    .refine((value) => !value.endsWith("/"), {
      message: "Base URL must not end with a slash",
    }),

  NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_SANITY_DATASET: z.string().min(1),
  // Recommended, not required (./env-recommendations.ts).
  SANITY_API_READ_TOKEN: z.string().min(1).optional(),
  SANITY_REVALIDATE_SECRET: z.string().min(1).optional(),

  HTTP_BASIC_AUTH: z
    .string()
    .refine(
      (value) => {
        if (!value.includes(":")) return false;

        const [username, password] = value.split(":");

        if (username === "") return false;
        if (password === "") return false;

        return true;
      },
      {
        message:
          "Must be in format 'username:password' with both username and password provided",
      },
    )
    .optional(),

  // Enumerated so a typo ("False", "0") fails instead of silently changing indexing.
  IS_INDEXABLE: z.enum(["true", "false"]).optional(),

  NEXT_PUBLIC_GTM_ID: z.string().optional(),

  RESEND_API_KEY: z.string().min(1).optional(),
  CONTACT_FORM_RECIPIENT_EMAIL: z.string().email().optional(),
  CONTACT_FORM_FROM_EMAIL: z.string().email().optional(),

  // Lets `proxy.ts` read `/api/redirects` on a protected Vercel preview (set by
  // Vercel when "Protection Bypass for Automation" is enabled).
  VERCEL_AUTOMATION_BYPASS_SECRET: z.string().min(1).optional(),
});

export type Env = z.infer<typeof envSchema>;

// `KEY=` (from `.env.example`) counts as unset, so a blank optional var passes.
const withoutEmptyValues = (env: NodeJS.ProcessEnv) =>
  Object.fromEntries(Object.entries(env).filter(([, value]) => value?.trim() !== ""));

export const validateEnvironmentVariables = () => {
  const env = withoutEmptyValues(process.env);
  const result = envSchema.safeParse({
    ...env,
    NEXT_PUBLIC_BASE_URL: resolveBaseUrl(env),
  });

  if (result.success) {
    return {
      env: result.data,
      missingRecommended: getMissingRecommendedEnv(env),
    };
  }

  const errors = result.error.issues.map((error) => ({
    path: error.path.join("."),
    message: error.message,
  }));

  throw new Error(
    `Environment variable validation failed:\n${errors.map((e) => `  - ${e.path}: ${e.message}`).join("\n")}`,
  );
};
