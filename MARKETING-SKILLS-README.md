# Marketing skills: start here

This repository has five skills for marketers. An AI agent (Claude) runs them for you: you
write what you need in plain words and get back a report.

| Skill | What you get |
|---|---|
| `brand-kit` | A brand kit (voice, audiences, facts with sources) from a company's website |
| `blog-post-quality-review` | A critical review of a post or draft: a 0–10 score and the three fixes that matter most |
| `source-review` | Every claim in an article checked against real sources: PASS, warnings or BLOCKED |
| `internal-links` | The links between your own articles that are missing, as a list for the editor |
| `blog-post-update` | Why a post lost traffic and what to change in it, as a change list for the editor |

They work on any website and any CMS. They read public pages and propose changes; nothing is
published, a person makes the change.

You don't need to know the terminal. Setup takes about 15 minutes, and the agent guides you
through it.

## 1. Install the agent

1. Download the Claude app from https://claude.com/download (Mac or Windows) and install it.
2. Sign in.
3. Make a folder for your work, e.g. `Marketing AI` in `Documents`. Reports will be saved there.
4. In the Claude app, open the **Code** tab and choose that folder.

## 2. Install the skills

In the Code tab, type these two lines, one at a time, and confirm the install when asked:

```text
/plugin marketplace add Pagepro/nexity
```

```text
/plugin install marketing-skills@nexity
```

Then start a new conversation in the same folder, so the agent sees the new skills.

## 3. Ask for setup

Type:

> Help me setup these skills for marketers

You can write in your own language. The agent will:

1. ask which skills you want and which website to test them on,
2. check what is missing on your computer and tell you, click by click, how to install it
   (usually only Node.js, a free program some skills run on),
3. install and build the rest itself; it asks before it changes anything,
4. run a short test of each skill,
5. list what you can now ask for, with example sentences.

When it asks for permission to run a command, read the one-line description and allow it. If
it asks you to restart the app, quit it completely, open it again in the same folder and write
"continue the setup".

## After setup

Open the Claude app, the **Code** tab, the same folder, and write what you need:

- "Make a brand kit for https://company.com"
- "Review this post: https://company.com/blog/…" (or paste the text)
- "Check the sources in this article: https://…"
- "Find missing internal links on https://company.com/blog/"
- "This post dropped in Google, what should we change? https://…"

Results are saved in your folder; ask the agent to open the report for you.

**New version of the skills?** Type `/plugin`, open **Marketplaces**, pick `nexity` and update
it (you can turn on auto-update there too). Then write "Help me setup these skills for
marketers" once more.

## Other ways to install

**Codex, Cursor and other agents** (needs Node.js): ask the agent to run

```bash
npx skills add Pagepro/nexity
```

and pick the five skills above plus `marketing-setup` and `work-humanizer` from the list it
shows. Then type "Help me setup these skills for marketers".

**Without installing anything into the agent:** on this repository's GitHub page, click the
green **Code** button, then **Download ZIP**. Unzip it, open the unzipped folder (the top one,
not a folder inside it) in the agent and type "Help me setup these skills for marketers".
Your reports are then saved inside that folder.
