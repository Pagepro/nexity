# Nexity Marketing Skills

Skills for marketers, by Pagepro. You write what you need in plain words, Claude does the work
and gives you a report. They work on any website and any CMS. They read public pages and
propose changes; nothing is published, a person makes the change.

| Skill | What you get |
|---|---|
| `brand-kit` | A `BRAND.md` (voice, audiences, offer, facts with sources) and a report of what the site contradicts, from a company's website |
| `blog-post-quality-review` | A critical review of a post or draft: a 0–10 score and the three fixes that matter most |
| `site-contradictions` | Every place where the site says two different things about the same fact, with both quotes and a fix or a question for whoever owns the fact |
| `internal-links` | The links between your own articles that are missing, as a list for the editor |
| `blog-post-update` | Why a post lost traffic and what to change in it, as a change list for the editor |

Three more skills do the groundwork: `marketing-setup` guides you through the setup,
`source-review` checks the facts in a post, and `work-humanizer` makes proposed text read like a
person wrote it. `blog-post-update` uses the last two.

## Install

In Claude Code (the **Code** tab of the Claude app), type these two lines, one at a time:

```text
/plugin marketplace add Pagepro/nexity
```

```text
/plugin install nexity-marketing-skills@nexity
```

Start a new conversation and type **"Help me setup these skills for marketers"**. The agent
checks what is missing (usually only Node.js, which `internal-links` and `blog-post-update`
need), asks before it installs anything, and runs a short test of each skill. `brand-kit`,
`blog-post-quality-review` and `site-contradictions` need nothing besides the agent.

The full guide, including other agents and the setup without a plugin:
https://github.com/Pagepro/nexity/blob/main/MARKETING-SKILLS-README.md

## Example requests

- "Make a brand kit for https://company.com"
- "Review this post: https://company.com/blog/…" (or paste the text)
- "Find contradictions on https://company.com"
- "Find missing internal links on https://company.com/blog/"
- "This post dropped in Google, what should we change? https://…"

## License

MIT, by [Pagepro](https://pagepro.co).
