# Agent skills and reviewers

This project includes `.agents/skills/`, `.agents/agents/` and the small Node-only
installer in `.agents/tooling/`. They work after copying this project on its own;
no parent checkout, network download or global skill installation is required.

Codex reads `.agents/skills/` directly. Claude Code uses the committed
`.claude/skills` and `.claude/agents` symlinks. Other agents can read the same
`SKILL.md` and reviewer Markdown files. `CLAUDE.md` imports `AGENTS.md`.

## Install and client adapters

From the project root:

```bash
pnpm agent:install
pnpm agent:doctor
```

`agent:install` without a source repairs missing client links. It preserves the
recorded upstream hashes, including when you have customized a skill. It does not
restore missing skill files; use the recorded source version to restore those.
The commands also work before installing dependencies:
`node .agents/tooling/cli.mjs install` and `node .agents/tooling/cli.mjs doctor`.

To enable Cursor discovery as well:

```bash
pnpm agent:install --clients claude,codex,cursor
```

This adds `.cursor/skills` pointing to `.agents/skills`. Codex needs no adapter.
The `--clients` list selects which adapters to maintain; previously created links
are not deleted. No client configuration or existing directory is overwritten.
On Windows, the installer creates directory junctions. If Git checked out a
symlink as a plain text file, move that file aside, then rerun the command. After
moving a checkout, move stale Windows junctions aside, then recreate them with
`agent:install`; conflicting adapters are never replaced automatically.

## Install additional skills or update

Use a **trusted local checkout** of the source repository at the version you want.
Clone/fetch it with your normal Git authentication, then check out the reviewed
commit or tag. The installer does not fetch, execute source code, configure MCP,
or obtain credentials. A source is a directory containing `.agents/catalog.json`.

```bash
pnpm agent:install --source /path/to/source-checkout --skills create-section,pr-writeup --dry-run
pnpm agent:install --source /path/to/source-checkout --skills create-section,pr-writeup
pnpm agent:update --source /path/to/source-checkout --dry-run
pnpm agent:update --source /path/to/source-checkout
```

Installation is additive: it retains existing selected skills and includes the
new selection's dependencies and reviewers from `catalog.json`. Without
`--skills`, a first installation selects all compatible skills. A capability-
specific skill is included only when its required project directory exists.
Updating retains the installed selection; new optional skills are opt-in.

`.agents/install-lock.json` records the catalog version, a content SHA-256, the
selected skills, clients and every managed file's hash. The content digest
identifies the exact installed snapshot, including uncommitted source changes;
it is **not a Git commit ID**. Commit this lock along with the installed files.

All conflicts are checked before writes. An edited or locally deleted managed
file, an unmanaged file at a destination, or a conflicting client adapter blocks
the entire update. Identical files may be adopted. Files removed upstream are
removed locally only if they still match their installed hash. Extra local files
are preserved. There is no force-overwrite option.

When a conflict occurs, save your customization separately, restore the managed
file from the previous source version, update, then reapply and review your
change. Keep unrelated project-specific skills under their own names. A filesystem
error during the write phase is not transactionally rolled back; use Git to
inspect/recover a partial write and rerun from a consistent installation.

## Available workflows

The installed `.agents/catalog.json` is the inventory and dependency graph.

- Build: `project-setup`, `create-section`, `sanity-module-catalog`.
- Maintenance: `link-fix`, `generate-alts`, `sanity-optimizations`.
- Delivery: `pr-writeup`, `work-humanizer`.
- Product mock tooling, when present: `product-mock`.

Each skill brings the agents it hands off to:

- `create-section`: the reviewers `content-model-architect`,
  `styling-fidelity-reviewer`, `sanity-schema-reviewer`, `groq-parity-reviewer`
  and `link-reviewer`, plus the `sanity-module-catalog` skill for the tile.
- `link-fix`: `link-reviewer`.
- `sanity-optimizations`: the auditors `sanity-query-auditor`,
  `sanity-image-auditor` and `sanity-delivery-auditor`, plus
  `groq-parity-reviewer`.
- `generate-alts`: `alt-text-writer`, which returns alt proposals instead of a
  verdict.

Agents without a subagent facility follow their checklists inline.

Workflow-specific prerequisites (Chrome, Python/Pillow for image composition,
CMS write permissions) remain in each skill; the installer does not
install these tools. See [agent-tools.md](agent-tools.md) for MCP setup and doctor.

## Attribution

`work-humanizer` is MIT-licensed third-party work from
[phuryn/work-humanizer](https://github.com/phuryn/work-humanizer). Its license ships
with the skill. Preserve it when redistributing the agent layer.
