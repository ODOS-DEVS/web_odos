# web_odos

A modern web application starter built with Next.js, React, TypeScript, and Tailwind CSS. It uses the App Router and keeps application code in the root-level `app/` directory.

## Tech stack

- [Next.js](https://nextjs.org/) 16
- [React](https://react.dev/) 19
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) 4
- [pnpm](https://pnpm.io/)
- [ESLint](https://eslint.org/)

## Requirements

- Node.js 22 or newer
- pnpm 9.15.0

If pnpm is not installed, enable it through Corepack:

```bash
corepack enable
corepack prepare pnpm@9.15.0 --activate
```

## Getting started

Install the dependencies:

```bash
pnpm install
```

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Edit `app/page.tsx` to update the home page; changes appear automatically during development.

## Available commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the local development server |
| `pnpm lint` | Check the project with ESLint |
| `pnpm build` | Create an optimized production build |
| `pnpm start` | Run the production build |

## Project structure

```text
.
├── app/
│   ├── (store)/              # Storefront routes (header + footer): home, products/[id], stores/[slug],
│   │                         #   cart, checkout (+ /success), orders (+ [id])
│   ├── (auth)/               # login / signup, split-screen layout
│   ├── globals.css           # Design tokens (light + dark), motion utilities, viewport variants
│   └── layout.tsx            # Root layout, metadata, theme script, QueryProvider
├── components/               # ui/ layout/ home/ product/ store/ cart/ checkout/ orders/ auth/ providers/
├── hooks/                    # TanStack Query hooks (use-catalog, use-orders, use-auth, use-delivery-quote), use-cart, use-theme
├── services/                 # Fetchers per API area (*.service.ts), http.ts client, mappers.ts, queries.ts
├── libs/
│   ├── api-endpoint.ts       # Every backend URL in one place
│   ├── query-client*.ts      # Query client (browser singleton / per-request on the server)
│   └── …                     # format, cart, checkout, orders, auth-session, theme helpers
└── types/                    # UI models + `api.ts` aliases over the generated `api-schema.d.ts`
```

## Backend API

The app talks to the live ODOS backend (`https://appbe.odos.market`, OpenAPI at `/openapi.json`).

- **Data flow:** `libs/api-endpoint.ts` → `services/*.service.ts` (typed fetchers, return UI models) →
  `services/queries.ts` (query keys + options) → `hooks/*` (TanStack Query) → components.
  Catalogue pages prefetch on the server and hydrate the client cache, so they are fully server-rendered for SEO.
- **CORS:** the backend only allows whitelisted browser origins. The browser therefore calls the same-origin
  `/api/*`, which `next.config.ts` proxies to the backend. Server-side fetches call it directly.
- **HTTP client:** one axios instance in `utils/axios.ts` (timeout, bearer-token and 401 interceptors), wrapped by
  `services/http.ts`, which turns failures into a typed `ApiError`. On the server axios runs on `fetch`, so Next's data
  cache still applies.
- **Devtools:** the React Query devtools are mounted in development only — click the floating button at the bottom-right
  of any page to inspect the cache (queries, freshness, refetching).
- **Auth:** bearer token (no refresh endpoint — users log in again when it expires), stored in `localStorage`.
- **Types:** `pnpm api:types` regenerates `types/api-schema.d.ts` from the live spec.
- **Config:** copy `.env.example` to `.env`. All environment variables are read in one place, `utils/config.ts`
  (`NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_SITE_URL`); import `CONFIG` from there instead of reading `process.env`.

## Styling

Tailwind CSS is loaded in `app/globals.css`:

```css
@import "tailwindcss";
```

Tailwind utility classes can be used directly in pages and components. Tailwind 4 detects source files automatically, so no `tailwind.config` file is required for the default setup.

## Continuous integration

The GitHub Actions workflow runs for every push and pull request. It installs dependencies using the frozen pnpm lockfile, runs ESLint, and verifies that the production build succeeds.

Before opening a pull request, run the same checks locally:

```bash
pnpm lint
pnpm build
```

## Deployment

Build and run the application on any Node.js host:

```bash
pnpm build
pnpm start
```

The project can also be deployed directly to [Vercel](https://vercel.com/new).
