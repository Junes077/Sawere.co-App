# Sawere Legal OS

An AI-powered Legal Operating System for **Sawere & Company Advocates** — built as a
real, multi-tenant platform architected to grow from a single firm to a multi-firm
SaaS product, not a demo.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn-style UI, Framer Motion |
| Backend | Next.js Route Handlers, Prisma ORM |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth (email/password, Google/Microsoft OAuth, TOTP 2FA) |
| Storage | Supabase Storage (private, firm-scoped) |
| AI | Claude (Anthropic API) |
| Desktop | Tauri (Windows primary target) |
| Mobile | Capacitor (Android; iOS-ready) |

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the pieces fit together and
[docs/SECURITY.md](docs/SECURITY.md) for the security model.

## Modules

Dashboard · Clients · Cases · Documents (AI Document Brain) · Calendar · Meetings ·
Tasks · Legal Research · Contracts (AI Document Generator) · Invoices & Payments ·
AI Assistant · Settings (Security, Preferences, Integrations, Audit log).

Every module reads/writes through the same Prisma schema (`prisma/schema.prisma`),
so features that aren't fully wired up yet (meeting recording & transcription,
live case-law search, Gmail/Outlook, WhatsApp Business) already have their data
model and API surface in place — see the "Roadmap" callouts inside those pages.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Supabase + Anthropic keys
npm run db:push              # push the Prisma schema to your Supabase Postgres
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll land on `/login`; use
"Create your firm" to sign up and provision your firm workspace.

### Required setup in Supabase

1. Create a project, then copy its URL/anon key/service-role key into `.env.local`
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`) and its Postgres connection strings
   (`DATABASE_URL`, `DIRECT_URL`).
2. Run `npm run db:push` to create the schema (or `npm run db:migrate` once you
   want tracked migrations). If your network blocks raw Postgres connections
   (common on locked-down/managed devices — e.g. a university-enrolled
   laptop) but you can still reach the Supabase dashboard, run
   `npm run db:generate-sql` instead — it produces `schema-setup.sql`
   entirely offline (no DB connection needed), which you paste into the
   Supabase SQL Editor and run there over plain HTTPS.
3. Run `npm run db:sql -- supabase/storage.sql` to create the private
   `documents` bucket and its access policies (or paste the file into the
   Supabase SQL editor if you prefer the dashboard).
4. Run `npm run db:sql -- supabase/rls.sql` to enable Row Level Security as
   defense-in-depth (the app itself talks to Postgres via Prisma's direct
   connection, which bypasses RLS — this is a backstop, not the primary
   authorization layer).
5. Enable Email auth, and optionally Google/Microsoft (Azure) OAuth, under
   Authentication → Providers. Set `NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED=true`
   / `NEXT_PUBLIC_MICROSOFT_LOGIN_ENABLED=true` once configured.

### AI

Set `ANTHROPIC_API_KEY` to enable the AI Assistant, AI case summaries, AI task
prioritization and AI document drafting. Every AI feature fails gracefully
with a clear message if the key isn't set — the app is fully usable without it.

## Desktop (Windows) & Android

- `npm run desktop:dev` / `npm run desktop:build` — see
  [docs/DESKTOP.md](docs/DESKTOP.md).
- `npm run cap:sync` / `npm run cap:open:android` — see
  [docs/MOBILE.md](docs/MOBILE.md).

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` / `start` | Production build / run |
| `npm run lint` | ESLint |
| `npm run db:push` | Push `prisma/schema.prisma` to the database |
| `npm run db:migrate` | Create a tracked migration |
| `npm run db:studio` | Prisma Studio |
| `npm run desktop:dev` / `desktop:build` | Tauri desktop shell |
| `npm run cap:sync` / `cap:open:android` | Capacitor Android shell |

## Project layout

```
src/
  app/                 # Route groups: (auth), (app), api/*
  components/          # ui/ (primitives) + feature folders per module
  lib/
    data/               # Prisma query functions, one file per module
    validators/         # zod schemas shared by API routes and forms
    ai/                 # Claude client + prompts
    supabase/           # browser/server/middleware Supabase clients
  config/nav.ts         # sidebar navigation source of truth
prisma/schema.prisma    # the entire data model, multi-tenant via firmId
supabase/                # storage + RLS SQL to run against your project
src-tauri/               # Windows desktop shell (Tauri)
capacitor.config.ts       # Android shell config (Capacitor)
docs/                    # architecture, security, desktop & mobile guides
```
