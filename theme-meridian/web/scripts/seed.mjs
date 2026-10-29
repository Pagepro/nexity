// oxlint-disable no-console
// Imports the demo dataset (seed/meridian.tar.gz in the repo root) into the
// dataset this site reads. `--replace` overwrites documents with the same `_id`;
// documents under other ids stay.
//
// Usage (from repo root): pnpm seed [--dataset=develop]
//
// Env (web/.env.local, then web/.env): NEXT_PUBLIC_SANITY_PROJECT_ID,
// NEXT_PUBLIC_SANITY_DATASET. Auth: SANITY_API_WRITE_TOKEN (or SANITY_API_TOKEN; an
// Editor token), else your `sanity login` session. Revoke the token
// `sanity init --template` created once the content is in.

import { config as loadEnv } from "dotenv";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.resolve(scriptDir, "..");
const seedFile = path.resolve(webDir, "..", "seed", "meridian.tar.gz");

// `.env.local` wins, as in Next; `sanity init --template` writes that one.
loadEnv({
  path: [path.join(webDir, ".env.local"), path.join(webDir, ".env")],
  quiet: true,
});

const datasetArg = process.argv.find((arg) => arg.startsWith("--dataset="));

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = datasetArg
  ? datasetArg.split("=")[1]
  : process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_TOKEN;

if (!existsSync(seedFile)) {
  console.error(
    "No seed archive at seed/meridian.tar.gz (repo root).\n" +
      "The Meridian demo dataset is not in this checkout yet. See seed/README.md for how it is made, " +
      "or create Site settings, the header, the footer and the / page in the Studio instead.",
  );
  process.exit(1);
}

if (!projectId || !dataset) {
  console.error(
    "Missing env. Need NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET in web/.env.local or web/.env",
  );
  process.exit(1);
}

if (!token) {
  console.log(
    "No SANITY_API_WRITE_TOKEN set, so the import uses your `sanity login` session.",
  );
}

console.log(`Importing seed/meridian.tar.gz into ${projectId}/${dataset} (--replace)…\n`);

const child = spawn(
  "sanity",
  [
    "dataset",
    "import",
    seedFile,
    "--project-id",
    projectId,
    "--dataset",
    dataset,
    "--replace",
  ],
  {
    cwd: webDir,
    stdio: "inherit",
    // `sanity` resolves from web/node_modules/.bin when run outside a pnpm script.
    shell: process.platform === "win32",
    env: {
      ...process.env,
      PATH: [path.join(webDir, "node_modules", ".bin"), process.env.PATH].join(
        path.delimiter,
      ),
      // The CLI reads the import token from this variable (keeps it off argv).
      ...(token ? { SANITY_IMPORT_TOKEN: token } : {}),
    },
  },
);

child.on("exit", (code) => {
  if (code === 0) {
    console.log(
      "\nDone. Reload the site. Revoke SANITY_API_WRITE_TOKEN once you no longer seed content.",
    );
  }
  process.exit(code ?? 1);
});
