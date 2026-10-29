# Agent tools and diagnostics

Run `pnpm agent:doctor` from the project root, or
`node .agents/tooling/cli.mjs doctor` before installing dependencies. It is read-only:
no package installs, content writes, server starts, tokens, or config changes.

```bash
pnpm agent:doctor
pnpm agent:doctor --json
pnpm agent:doctor --url http://localhost:3001
```

Checks include Node against `engines.node`, pnpm against `packageManager`, package
installation directories, required/recommended env presence, matching Web/Studio
project and dataset, installed skill hashes/dependencies/reviewers, client links,
project MCP JSON configuration, the local HTTP server and Next.js runtime MCP.
The HTTP and MCP probes each time out after 2.5 seconds. Only loopback URLs are
accepted, with no credentials or query parameters; no remote CMS is contacted.

`pass` means the stated check passed; `warn` identifies an optional/missing runtime
capability or local modification; `fail` identifies a required setup problem;
`skip` means a check needs the agent client. Exit code is 1 if any check fails,
otherwise 0. Warnings do not mean the integration is fully working.

Environment files are parsed in development precedence order: `.env`,
`.env.development`, `.env.local`, `.env.development.local`, then shell values.
Only names and presence/mismatch results are printed, never values. This is a
presence check, not full Next.js env expansion or validation; still run the
project's `pnpm -C web envs:validate` for application validation.

MCP configuration discovery checks `.mcp.json`, `.cursor/mcp.json` and
`.vscode/mcp.json` (strict JSON). Global configs and other client formats, including
Codex TOML, are not inspected; a warning can mean the connection is configured
elsewhere. Configuration detection does not prove client loading or authorization.
The separate runtime check asks the local `/_next/mcp` endpoint for `tools/list`;
a generic HTTP 200 alone does not count as a working Next.js MCP server.

## Next.js DevTools MCP

The official [Next DevTools MCP](https://github.com/vercel/next-devtools-mcp)
connects a coding agent to the running Next.js dev server for runtime errors,
routes and logs. Its documentation gateway points at documentation matching the
installed Next.js version. Start `pnpm dev:web`, then enable the connection in the
agent client.

For Claude Code, `.mcp.example.json` is a project configuration example. Copy it
only if `.mcp.json` does not exist; otherwise merge the desired entries without
replacing existing settings. Review the selected package version before use.
The example follows the upstream `@latest` setup; pin a reviewed version if your
project needs reproducible tooling. These external packages are not installed by
`agent:install` or locked by `install-lock.json`.

For Cursor, put the `mcpServers` entries in `.cursor/mcp.json`; for VS Code use
`servers` instead of `mcpServers` in `.vscode/mcp.json`. For other clients, follow
the client-specific instructions in the upstream repository. Do not copy one
client's JSON format into another client's configuration file.

Confirm in the agent client that it can discover the correct local server and
read its errors. When several worktrees are running, select the right port.
The doctor runtime probe is independent of whether the client loaded DevTools MCP.

## Sanity Agent Toolkit

[Sanity Agent Toolkit](https://github.com/sanity-io/agent-toolkit) supplies official
skills and an MCP server for content, schemas and project operations. It complements
the local skills, which describe this project's conventions.

The official server is `https://mcp.sanity.io`. Configure it using the example or
the upstream instructions for your client, then authenticate through the client's
supported flow. The toolkit also documents `sanity mcp configure` for supported
clients using an authenticated CLI; check the installed CLI's help before using it.
Keep credentials in the client's secret/auth storage, never in committed config
or in chat. The example contains no token.

Start verification with a read-only query of the intended project and schema.
Confirm the project and dataset before content work. Authentication success and
write permissions must be established in that client; doctor reports these as
unverified. Do not publish content merely to test a connection.

Install official Sanity skills through the toolkit's documented installer or
plugin for your client. Keep them under their upstream names; do not replace
project-specific skills with generic rules. Figma access is optional;
`create-section` uses it only when given a Figma link.
