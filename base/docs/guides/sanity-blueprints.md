# Sanity Blueprints: CORS and the revalidate webhook as code

The project's CORS origins and the revalidate webhook are declared in
[`sanity.blueprint.ts`](../../sanity.blueprint.ts) and applied with the
Sanity CLI, instead of being clicked together in sanity.io/manage. `plan` shows
the diff against the live project, `deploy` applies it.

**The file is the source of truth.** A resource missing from it is removed on
the next deploy, and a change made in sanity.io/manage to a resource it owns is
overwritten. Resources are matched by `name`; renaming one destroys it and
creates a new one.

## What it declares

| Resource | When | Notes |
|---|---|---|
| CORS `SANITY_BLUEPRINT_SITE_URL` | once the domain is known | With credentials, the embedded Studio lives at `$SITE/admin` |
| CORS for each `SANITY_BLUEPRINT_EXTRA_ORIGINS` entry | optional | The `www` variant, a preview wildcard, another local port (`http://localhost:3001`). One entry per port, because the Blueprints API rejects `http://localhost:*` (subdomain wildcards are accepted) |
| Webhook `revalidate` → `$SITE/api/revalidate` | once the domain is known | Create/update/delete; filter excludes only `sanity.*` and `system.*` types (assets, releases, Presentation's preview secrets), so new document types need no change; `contentOnly` (`delta::changedOnly`) lets a body-only edit purge one route; signed with `SANITY_REVALIDATE_SECRET` |

Without `SANITY_BLUEPRINT_SITE_URL` and extra origins the blueprint declares
nothing, and `plan` shows an empty stack. That is expected on day one.

**No localhost origin is declared.** Sanity creates `http://localhost:3333` (the
standalone Studio) with every new project, and `sanity init --template` adds
`http://localhost:3000` (the web app and `/admin`). Both exist before the first
deploy, outside the stack, so declaring either one failed every new project's
first deploy with `409 Duplicate origin` (the deploy rolls back everything). The
stack never owns them, so a deploy never removes them either. A project missing
one adds it once:
`pnpm --filter @nexity/studio exec sanity cors add http://localhost:3000 --credentials`,
or lists it in `SANITY_BLUEPRINT_EXTRA_ORIGINS`.

The origin list is deduplicated, so repeating the site URL in
`SANITY_BLUEPRINT_EXTRA_ORIGINS` is harmless; without that, two resources with
the same name would be declared.

> **A stack deployed by an older blueprint that declared `:3000` or `:3333`**
> owns that origin, so the next `plan` shows `cors-localhost-3000` or
> `cors-localhost-3333` as **deleted**, and `deploy` would remove it (local
> Studio login stops working). Keep it by adding it to
> `SANITY_BLUEPRINT_EXTRA_ORIGINS` before deploying: the resource name derives
> from the origin, so the stack keeps it as it is.

The file refuses a platform-wide wildcard (`https://*.vercel.app`): with
credentials it would let any site on the platform act as a logged-in editor.
Anchor preview wildcards to the team scope (`https://*-<team-slug>.vercel.app`)
or to a domain you own (`https://*.previews.example.com`). A `*` covers one
subdomain level only.

## Env

The file loads `web/.env.local`, then `web/.env` (`sanity init` writes the first),
with dotenv. Values already in the shell win, so production values can be passed
inline.

| Variable | Required | Meaning |
|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET` | yes | Project and dataset the webhook watches |
| `SANITY_BLUEPRINT_SITE_URL` | no | **Your site's URL**: `https://example.com` or `https://<project>.vercel.app`, with the protocol, no trailing slash. Empty → no site CORS, no webhook (fine until the domain is known) |
| `SANITY_BLUEPRINT_EXTRA_ORIGINS` | no | Comma-separated extra origins, each with the protocol, or empty. Another local port goes here (`http://localhost:3001`), and `http://localhost:3000` or `:3333` when the project lacks it |
| `SANITY_REVALIDATE_SECRET` | with the site URL | Must equal the value on the **production** deploy (Vercel), or `/api/revalidate` answers 401 |

> **`[blueprint] "…" is not an origin (protocol://host[:port], no path or trailing slash)`**
> stops `init`, `plan` and `deploy` when one of the two holds a bare host
> (`acme.vercel.app`), a path or a placeholder. Add `https://`, or leave it empty.

## First run on a new project (once)

Links the existing file to a new stack in the project. It needs a project
admin, or a token with `sanity.project.blueprints.deploy`. It does not
overwrite the blueprint file.

```bash
pnpm exec sanity login   # if not logged in
pnpm exec sanity blueprints init . --project-id <projectId> --stack-name production
```

The stack link lands in `.sanity/` (repo root), which is gitignored, so every teammate
links their checkout once. To link to the stack that already exists:
`pnpm exec sanity blueprints config --edit --project-id <projectId> --stack production`.
A project allows 3 stacks.

## Day to day

```bash
pnpm blueprints:plan     # read-only diff against the live stack
pnpm blueprints:deploy   # apply (it shows no preview of its own, so plan first)
pnpm blueprints:info     # what is live on the stack
```

With production values:

```bash
SANITY_BLUEPRINT_SITE_URL=https://example.com SANITY_REVALIDATE_SECRET=<prod secret> pnpm blueprints:plan
```

Deploy again when:

- the client's domain is known, or it changes (set `SANITY_BLUEPRINT_SITE_URL`),
- the revalidate secret is rotated.

## Moving from hand-made resources

Blueprints only manages what it created, and it does not adopt a resource made
by hand in sanity.io/manage.

- **CORS: delete the hand-made duplicates before the first deploy.** An origin
  that already exists fails the deploy with `409 Duplicate origin already
  exists for this project`, and the whole deploy rolls back (resources created
  earlier in the same run, such as the webhook, are destroyed again). The
  deploy stops at the first conflict, so compare the full list:
  ```bash
  pnpm blueprints:plan                                   # origins the blueprint creates
  pnpm --filter @nexity/studio exec sanity cors list   # origins already in the project
  pnpm --filter @nexity/studio exec sanity cors delete <origin>   # each duplicate
  pnpm blueprints:deploy
  ```
  Between the delete and the deploy that origin has no CORS entry, so do both in
  one go. Hand-made origins the blueprint doesn't declare (an old preview URL,
  another localhost port) stay untouched; remove the stale ones by hand.
- **Webhook: delete the hand-made one after the deploy** in sanity.io/manage →
  API → Webhooks. Webhooks don't conflict, so both would fire and every publish
  would revalidate twice.

`lifecycle.ownershipAction: { type: "attach", id }` can adopt an existing
resource, but `@sanity/blueprints` marks it experimental and hidden, so the
starter doesn't use it.

## Notes

- **Never delete a resource the stack owns by hand** (sanity.io/manage,
  `sanity cors delete`). The stack still lists it, so the next
  `blueprints destroy` fails with `HTTP 404 Hook not found` (or the CORS
  equivalent) and rolls back. Remove it from the blueprint and deploy instead.

- Webhooks via Blueprints are marked **beta** in `@sanity/blueprints` and may
  change. Check the changelog on each bump of the package.
- Deploying from CI (the official `sanity-io/blueprints-actions`) needs the env
  above as GitHub variables and secrets, plus a deploy token from
  `sanity blueprints mint-deploy-token`. Not set up yet.
