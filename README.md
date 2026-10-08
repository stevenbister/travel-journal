# Travel Journal

A shared, offline-first travel logging app for me and my better half. Built as an installable React PWA (frontend) with a Hono API on Cloudflare Workers + D1 (backend). See `docs/tdd.md` for the full technical design.

## What's inside?

Turborepo + pnpm workspace:

### Apps

- `apps/web`: React 19 + Vite + TanStack Router / Query / Form, Tailwind CSS 4, Dexie (IndexedDB) + PWA (Workbox). Served from Cloudflare Workers (`worker/index.ts`, proxies `/api` to the API service).
- `apps/api`: Hono on Cloudflare Workers, Drizzle ORM on Cloudflare D1 (SQLite), better-auth with Google OAuth (cookie sessions, sign-up disabled), OpenAPI + Scalar docs.

### Packages

- `packages/core`: shared auth (`auth/server.ts`, `auth/client.ts`), DB schema/utils, and tests consumed by `web` and `api`.
- `packages/ui`: shared React component library.
- `packages/eslint-config`, `packages/typescript-config`, `packages/vitest-config`: shared tooling config.

## Prerequisites

- Node `>=24`
- pnpm `11.25.0` (see `packageManager` in root `package.json`)
- A Cloudflare account + D1 database if you want remote DB access / deploys (Wrangler CLI is a devDependency in both apps).

## Getting set up

```sh
pnpm install
```

Configure the API environment:

```sh
cp apps/api/.env.example apps/api/.env
```

Then fill in `apps/api/.env`:

- `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_DATABASE_ID`, `CLOUDFLARE_D1_TOKEN` D1 credentials for remote DB / Drizzle Kit
- `BETTER_AUTH_URL="http://localhost:5173"` web dev origin
- `BETTER_AUTH_SECRET` 32+ char secret (`openssl rand -base64 32`)
- `BETTER_AUTH_OAUTH_PROXY_SECRET` 32+ char secret (`openssl rand -base64 32`)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` Google OAuth app credentials

Initialise the local D1 database (migrate + import remote snapshot + seed):

```sh
pnpm --filter api db:setup
```

## Running commands

From the repo root (Turborepo runs across all workspaces):

```sh
pnpm dev        # turbo run dev — web (Vite, :5173, proxies /api → :8787) + api (wrangler dev :8787)
pnpm build      # turbo run build
pnpm test       # turbo run test (vitest)
pnpm lint       # turbo run lint
pnpm typecheck  # turbo run typecheck
pnpm format     # prettier --write "**/*.{ts,tsx,md}"
```

Run a single workspace with a filter:

```sh
turbo dev --filter=web
turbo dev --filter=api
pnpm --filter web dev
pnpm --filter api dev
```

Useful app-scoped scripts:

```sh
# apps/api (run via pnpm --filter api <script>)
pnpm --filter api db:generate  # drizzle-kit generate
pnpm --filter api db:push      # push schema to D1
pnpm --filter api db:migrate   # run migrations
pnpm --filter api db:studio    # open Drizzle Studio
pnpm --filter api db:seed-admin
pnpm --filter api deploy       # wrangler deploy --minify
pnpm --filter api cf-typegen   # wrangler types

# apps/web
pnpm --filter web preview  # build + vite preview
pnpm --filter web deploy   # build + wrangler deploy
pnpm --filter web cf-typegen
```
