#!/usr/bin/env tsx

import { config } from "dotenv";

import { validateEnvironmentVariables } from "../setup/envVariables.js";

// Same files and order as Next: `.env.local` wins over `.env`.
config({ path: [".env.local", ".env"], quiet: true });

try {
  const { missingRecommended } = validateEnvironmentVariables();

  console.info("✅ All environment variables are valid!");

  for (const { name, purpose } of missingRecommended) {
    console.warn(`⚠️  ${name} is not set. ${purpose}`);
  }

  process.exit(0);
} catch (error) {
  console.error("❌ Environment validation failed:");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
