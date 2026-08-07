# Architecture

## Overview

Sawere Legal OS is a single Next.js App Router codebase that serves as the web
app, the API, and the backend for the desktop/mobile shells. There is no
separate backend service — Route Handlers under `src/app/api/**` are the API,
talking to Postgres through Prisma.

```
Browser / Tauri webview / Capacitor webview
              │
              ▼
      Next.js (App Router)
   ┌────────────┴─────────────┐
   │                          │
Server Components        Route Handlers (api/*)
(read via Prisma)         (read/write via Prisma,
   │                       call Claude, Supabase Storage)
   └────────────┬─────────────┘
                ▼
        Prisma → PostgreSQL (Supabase)
                │
        Supabase Auth (sessions, MFA)
        Supabase Storage (documents bucket)
        Anthropic Claude API (AI features)
```

## Multi-tenancy

Every business table carries a `firmId` (see `prisma/schema.prisma`). A `User`
row's primary key is the Supabase Auth user id, and `requireUser()` /
`requireApiUser()` (`src/lib/auth.ts`) resolve the signed-in Supabase user to
their `User` + `firmId` on every request. All Prisma queries in
`src/lib/data/*` and `src/app/api/**` are scoped by that `firmId` — this is
the primary authorization boundary today. `supabase/rls.sql` adds Postgres
Row Level Security as a second layer, scoped the same way, in case any
future code path queries the database directly with a user's Supabase
session instead of going through the server.

This design is what lets the same schema serve one firm today and a
multi-firm SaaS product later: onboarding a new firm is just inserting a new
`Firm` row (see `/signup` and `/api/auth/signup`) — no schema or query
changes required.

## Data layer conventions

- `prisma/schema.prisma` — the single source of truth for the data model.
- `src/lib/data/*.ts` — one file per module, exporting plain async functions
  that wrap Prisma queries (e.g. `listClients`, `getCaseDetail`). Server
  Components call these directly; Route Handlers call them too, to avoid
  duplicating query logic.
- `src/lib/validators/*.ts` — zod schemas shared between API routes (server
  validation) and forms (the same shape drives the request body).
- `src/app/api/**/route.ts` — thin: auth check → validate → call Prisma/data
  layer → audit log (for mutating actions on Client/Case/Document) → respond.

## Auth flow

1. Supabase Auth issues a session (cookie-based via `@supabase/ssr`).
2. `src/middleware.ts` refreshes the session on every request and redirects
   unauthenticated requests to `/login`.
3. `requireUser()` (Server Components) / `requireApiUser()` (Route Handlers)
   resolve the session to an app `User` row. No profile yet → `/onboarding`
   (handles first-time OAuth sign-ins, which skip the `/signup` firm-creation
   step).

## AI integration points

All AI calls go through `src/lib/ai/claude.ts` (a thin Anthropic SDK
wrapper) and fail gracefully with a 503 + clear message if
`ANTHROPIC_API_KEY` isn't set:

- **AI Assistant** (`/ai-assistant`, `api/ai/chat`) — streams a response
  grounded in a live snapshot of the firm's clients/cases/calendar/tasks
  (`buildFirmContext` in `src/lib/data/ai.ts`).
- **Case summaries** (`api/cases/[id]/ai-summary`) — summarizes a case's
  notes, deadlines and documents on demand.
- **Task prioritization** (`api/tasks/ai-prioritize`) — scores pending tasks
  0–100 by urgency.
- **Document generation** (`api/contracts/generate`) — drafts a document in
  the style of an advocate-supplied template (`DocumentTemplate`), given
  free-text instructions and optional client/case context.

## Extension points (schema exists, feature not fully wired)

These are intentionally shipped as real database models + partial UI so a
future session can complete them without a rewrite:

- **Meeting recording & transcription** — `Meeting` → `Recording` →
  `Transcript` models exist; meetings can be logged manually today. Wiring
  up the microphone capture + speech-to-text belongs in the desktop shell
  (`src-tauri`), which can call a transcription API and POST the result to
  a new `api/meetings/[id]/recording` route.
- **AI Document Brain folder indexing** — `DocumentFolder` stores
  advocate-approved folder paths (`/documents` → "AI indexed folders" tab).
  Actual filesystem scanning/OCR must run from the desktop shell (Node has
  no filesystem access to the advocate's machine from a hosted web app) and
  can reuse the existing `Document` model + `extractedText`/`aiTags` fields.
- **Legal research feed** — `LegalResearchNote` supports pinning
  judgments/notes today; live case-law search/tracking needs a licensed data
  source integration.
- **Gmail/Outlook & WhatsApp Business** — see `IntegrationsPanel` in
  Settings and the corresponding env vars in `.env.example`. Both need an
  OAuth app / Business API application approved before they can connect.

## Design system

`src/app/globals.css` defines the palette (cream/white/coffee/walnut/navy/
dark-gold) as CSS custom properties consumed via Tailwind v4's `@theme
inline`, with a dark-mode variant. `src/components/ui/*` are hand-built
shadcn-style primitives (no external UI kit dependency beyond Radix
primitives), so the visual language stays consistent and easy to retheme
from one file.
