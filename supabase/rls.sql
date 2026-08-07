-- Defense-in-depth Row Level Security for the app's Postgres tables.
--
-- The Next.js server talks to Postgres through Prisma using the database's
-- direct connection string (DATABASE_URL / DIRECT_URL), which authenticates
-- as a role that bypasses RLS — so these policies are NOT what authorizes
-- the app today. They matter the moment any client-side code (or a future
-- integration) queries these tables with the Supabase anon/authenticated
-- key instead of going through our API routes: RLS is the backstop that
-- keeps one firm's data from leaking to another firm's session even if a
-- server-side check is ever missed.
--
-- Run once against your Supabase project after `prisma db push`.

create or replace function public.current_firm_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select "firmId" from public.users where id = auth.uid()
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'firms', 'users', 'clients', 'cases', 'case_notes', 'case_deadlines',
    'documents', 'document_folders', 'writing_style_samples', 'document_templates',
    'calendar_events', 'meetings', 'recordings', 'transcripts', 'tasks',
    'invoices', 'invoice_items', 'payments', 'expenses',
    'ai_conversations', 'ai_messages', 'legal_research_notes', 'audit_logs'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Firms: a user may only see their own firm.
drop policy if exists "Members can read their firm" on public.firms;
create policy "Members can read their firm" on public.firms
  for select using (id = public.current_firm_id());

-- Users: readable/writable within the same firm.
drop policy if exists "Members can read firm users" on public.users;
create policy "Members can read firm users" on public.users
  for select using ("firmId" = public.current_firm_id());

-- Generic firm-scoped policy for every table that carries a firmId column.
do $$
declare
  t text;
begin
  foreach t in array array[
    'clients', 'cases', 'documents', 'document_folders', 'writing_style_samples',
    'document_templates', 'calendar_events', 'meetings', 'tasks', 'invoices',
    'expenses', 'ai_conversations', 'legal_research_notes', 'audit_logs'
  ]
  loop
    execute format(
      'drop policy if exists "Firm-scoped access" on public.%I', t
    );
    execute format(
      'create policy "Firm-scoped access" on public.%I for all using ("firmId" = public.current_firm_id()) with check ("firmId" = public.current_firm_id())',
      t
    );
  end loop;
end $$;

-- Child tables scoped through their parent's firmId.
drop policy if exists "Firm-scoped via case" on public.case_notes;
create policy "Firm-scoped via case" on public.case_notes for all
  using (exists (select 1 from public.cases c where c.id = "caseId" and c."firmId" = public.current_firm_id()));

drop policy if exists "Firm-scoped via case" on public.case_deadlines;
create policy "Firm-scoped via case" on public.case_deadlines for all
  using (exists (select 1 from public.cases c where c.id = "caseId" and c."firmId" = public.current_firm_id()));

drop policy if exists "Firm-scoped via meeting" on public.recordings;
create policy "Firm-scoped via meeting" on public.recordings for all
  using (exists (select 1 from public.meetings m where m.id = "meetingId" and m."firmId" = public.current_firm_id()));

drop policy if exists "Firm-scoped via recording" on public.transcripts;
create policy "Firm-scoped via recording" on public.transcripts for all
  using (exists (
    select 1 from public.recordings r
    join public.meetings m on m.id = r."meetingId"
    where r.id = "recordingId" and m."firmId" = public.current_firm_id()
  ));

drop policy if exists "Firm-scoped via invoice" on public.invoice_items;
create policy "Firm-scoped via invoice" on public.invoice_items for all
  using (exists (select 1 from public.invoices i where i.id = "invoiceId" and i."firmId" = public.current_firm_id()));

drop policy if exists "Firm-scoped via invoice" on public.payments;
create policy "Firm-scoped via invoice" on public.payments for all
  using (exists (select 1 from public.invoices i where i.id = "invoiceId" and i."firmId" = public.current_firm_id()));

drop policy if exists "Firm-scoped via conversation" on public.ai_messages;
create policy "Firm-scoped via conversation" on public.ai_messages for all
  using (exists (
    select 1 from public.ai_conversations c
    where c.id = "conversationId" and c."firmId" = public.current_firm_id()
  ));
