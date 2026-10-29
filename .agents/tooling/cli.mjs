import { resolve } from "node:path";
import { parseArgs } from "node:util";

import { install } from "./distribution.mjs";
import { doctor } from "./doctor.mjs";

try {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      source: { type: "string" },
      skills: { type: "string" },
      clients: { type: "string" },
      "dry-run": { type: "boolean" },
      json: { type: "boolean" },
      url: { type: "string" },
      help: { type: "boolean" },
    },
  });
  const [command] = positionals;
  if (values.help || !command) {
    console.info(
      "agent install [--source <checkout>] [--skills name,name] [--clients claude,cursor,codex] [--dry-run]\nagent update --source <checkout> [--dry-run]\nagent doctor [--url http://localhost:3000] [--json]\nSource is a trusted checkout containing .agents/catalog.json. No code from the source is executed during installation.",
    );
  } else if (command === "doctor" && positionals.length === 1) {
    const report = await doctor(process.cwd(), { url: values.url });
    if (values.json) console.info(JSON.stringify(report, null, 2));
    else
      for (const check of report.checks)
        console.info(`${check.status.toUpperCase()} ${check.id}: ${check.message}`);
    process.exitCode = report.checks.some((check) => check.status === "fail") ? 1 : 0;
  } else if (["install", "update"].includes(command) && positionals.length === 1) {
    if (command === "update" && !values.source)
      throw new Error(
        "update requires --source <trusted checkout at the desired version>.",
      );
    const result = await install({
      project: process.cwd(),
      source: resolve(values.source ?? "."),
      skills: values.skills?.split(","),
      clients: values.clients?.split(","),
      dryRun: values["dry-run"],
    });
    console.info(JSON.stringify(result, null, 2));
  } else throw new Error("Unknown command. Use --help.");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
