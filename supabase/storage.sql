-- Run once against your Supabase project (SQL Editor or `supabase db execute`).
-- Creates the private "documents" bucket used by the Documents module and
-- scopes access so a user can only read/write objects under their own
-- firm's folder prefix: documents/{firmId}/{uuid}-{filename}.

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Helper: the caller's firmId, looked up from public.users by auth.uid().
create or replace function public.current_firm_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select "firmId" from public.users where id = auth.uid()::text
$$;

drop policy if exists "Firm members can read their documents" on storage.objects;
create policy "Firm members can read their documents"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.current_firm_id()
  );

drop policy if exists "Firm members can upload their documents" on storage.objects;
create policy "Firm members can upload their documents"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.current_firm_id()
  );

drop policy if exists "Firm members can delete their documents" on storage.objects;
create policy "Firm members can delete their documents"
  on storage.objects for delete
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.current_firm_id()
  );
