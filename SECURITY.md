# Security policy

## Supported versions

Only the latest commit on `main` is supported. The starters are templates: once you create a project from one, the project is yours to keep up to date. Fixes land here and you port them to your project.

## Reporting a vulnerability

Please do not open a public issue for a security problem.

Report it privately, either:

- through GitHub's **Report a vulnerability** button on the Security tab of this repository (private vulnerability reporting), or
- by email to `security@pagepro.co`

Include:

- which part is affected (`base/`, `theme-meridian/`, `.agents/`, CI workflows),
- steps to reproduce or a proof of concept,
- the impact you expect (data exposure, token leak, XSS, open redirect, ...).

We will confirm that we received the report and agree on a disclosure date with you once a fix is ready.

## Scope notes

- Leaked Sanity tokens or project data in a project made from a starter belong to that project's owner. Rotate the token in Sanity (Manage > API > Tokens).
- Vulnerabilities in dependencies (Next.js, Sanity, etc.) should go to the upstream project. Tell us too if a starter needs an update or override.
