# Security model

## Authentication

- Supabase Auth (email/password today; Google/Microsoft OAuth wired up and
  gated behind `NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED` /
  `NEXT_PUBLIC_MICROSOFT_LOGIN_ENABLED` until you configure the providers).
- **2FA**: real TOTP enrollment via Supabase Auth MFA
  (`src/components/settings/two-factor-setup.tsx`) — QR enrollment, code
  verification, disable. No custom crypto; entirely delegated to Supabase.
- **Biometric login**: a device capability (Windows Hello / Android
  BiometricPrompt), not something a web page can implement — the
  `biometricEnabled` flag and UI are in place so the desktop/mobile shells
  can gate a native biometric prompt in front of the stored session.
- **Session timeout**: `User.sessionTimeoutMinutes`, editable in
  Settings → Security. Enforcing it client-side (auto sign-out on
  inactivity) is a small addition in the app shell once you decide the UX
  (warning modal vs. silent sign-out).

## Authorization

Every table carries `firmId`; every query in `src/lib/data/*` and
`src/app/api/**` filters by the signed-in user's `firmId`
(`requireApiUser()` in `src/lib/auth.ts`). This is the primary boundary.
`supabase/rls.sql` mirrors the same scoping as Postgres Row Level Security,
so the boundary holds even if a future code path queries Postgres directly
with a user's Supabase session instead of through the server. Route-level
role checks exist where they matter today (e.g. only `OWNER`/`ADMIN` can
edit firm details, `api/settings/firm/route.ts`) — extend the same pattern
(`auth.user.role`) as more role-gated actions are added.

## Encryption

- **At rest**: Supabase Postgres and Storage are encrypted at rest
  (AES-256, managed by Supabase/the underlying cloud provider).
- **In transit**: TLS everywhere (Supabase endpoints, Anthropic API).
- Secrets (`SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, DB credentials)
  live only in server-side env vars — never sent to the client. Search the
  codebase for `SUPABASE_SERVICE_ROLE_KEY` to confirm it's only read in
  `src/lib/supabase/server.ts` (`createAdminClient`), used from Route
  Handlers.

## Documents

- Uploaded to a **private** Supabase Storage bucket (`supabase/storage.sql`)
  under `documents/{firmId}/{uuid}-{filename}`.
- Client-side uploads use the user's own Supabase session (RLS-enforced by
  firm prefix); downloads go through short-lived (5 minute) signed URLs
  minted server-side (`api/documents/[id]/signed-url`), never public URLs.

## Audit logging

Mutating actions on Clients, Cases and Documents write an `AuditLog` row
(`firmId`, `userId`, `action`, `entityType`, `entityId`). Viewable at
Settings → Audit log. Extend the same `prisma.auditLog.create(...)` call at
the end of any new mutating route to keep coverage consistent.

## Threat model notes for reviewers

- All Route Handlers validate input with `zod` before touching Prisma.
- `requireApiUser()` returns a `401` `Response` rather than using
  `redirect()` inside API routes — a redirect would otherwise be silently
  followed by `fetch()` and break JSON parsing on the client while
  *looking* like an auth check was in place.
- The Claude system prompts explicitly instruct the model not to fabricate
  case facts and to label generated documents as drafts requiring review
  (`src/lib/ai/claude.ts`, `api/cases/[id]/ai-summary`,
  `api/contracts/generate`).
- Nothing sends email/WhatsApp messages automatically — those integrations
  are unbuilt by design until there's an approval step in the UI (see
  `docs/ARCHITECTURE.md` → Extension points).
