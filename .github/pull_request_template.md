## What and why

<!-- What changes, and what problem it solves. Link the issue if there is one. -->

## Which starter

- [ ] `base/`
- [ ] `theme-meridian/`
- [ ] `.agents/` (skills, reviewer agents)
- [ ] CI / repository files

## Ported to the other starter?

<!-- General fixes (schemas, GROQ, preview, revalidation, SEO, section bugs) go into both base/ and theme-meridian/ in this PR. -->

- [ ] Yes, the same change is in both `base/` and `theme-meridian/`
- [ ] Not needed: the change is only about one starter's look or content (say which)
- [ ] Not ported yet, reason:

## Test plan

<!-- Commands you ran, in each starter you changed, and what you checked in the browser. -->

- [ ] `pnpm lint`
- [ ] `pnpm format:check`
- [ ] `pnpm typecheck`
- [ ] `pnpm build`
- [ ] Checked in the browser (pages, `/admin`, Sections Gallery if a section changed):

## Screenshots

<!--
For visible changes: save before/after screenshots to `.github/pr-assets/<branch>/`
(e.g. before-home.png, after-home.png), commit them in this PR and link them
with a relative path, for example:
![after](.github/pr-assets/my-branch/after-home.png)
-->

## Checklist

- [ ] No Sanity project ids, datasets, tokens or other secrets in tracked files
- [ ] Docs updated (`README.md`, `docs/`) if behaviour or setup changed
