# AGENTS.md (repository)

This repository holds two independent starters, `base/` and `theme-meridian/`, plus the
agent layer in `.agents/`. Each starter has its own `AGENTS.md`, `DESIGN.md` and
`BRAND.md`; work inside one starter by its own files.

- **A fix goes into both starters** in the same change (schemas, GROQ, preview, SEO, a
  section bug, a rule in `AGENTS.md` or `docs/agents/`). Only the look and content of one
  starter stay in one folder. See `CONTRIBUTING.md` → "Fixes go to both starters".
- **Neither starter mentions the other.** A project is made from one of them and never sees
  the other folder.
- **No comments that restate the code**, in the starters and in `.agents/` scripts alike: only
  workarounds, must-know constraints and "change it here" hints (each starter's `AGENTS.md` →
  "Code design").
- **Skills and reviewers live in `.agents/`**; `.claude/` holds only symlinks to it.
  `base/.agents/` and `theme-meridian/.agents/` are generated snapshots: edit the root
  source, then run `node .agents/export.mjs` and commit both snapshots.
- **A marketer asking to set up the marketing skills** ("Help me setup these skills for
  marketers") gets `.agents/skills/marketing-setup/SKILL.md`, even when the agent does not list
  it (a ZIP can break the `.claude/skills` link). See `MARKETING-SKILLS-README.md`.
- **Keep each starter's root + `web/` `AGENTS.md` under ~30 KB together**: Codex reads 32 KiB
  per directory chain, this file included.
