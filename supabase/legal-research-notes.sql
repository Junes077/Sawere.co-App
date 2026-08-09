-- Run once against your Supabase project (SQL Editor) after pulling the
-- extended LegalResearchNote model. Additive only — new nullable columns and
-- two foreign keys, touches no existing data, safe to run on production.
-- (Generated via `prisma migrate diff`, same manual-apply pattern as
-- supabase/invitations.sql — this sandbox has no network path to the live
-- database to run `npm run db:push` directly.)

ALTER TABLE "legal_research_notes" ADD COLUMN     "caseId" TEXT,
ADD COLUMN     "caseNumber" TEXT,
ADD COLUMN     "citation" TEXT,
ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "court" TEXT,
ADD COLUMN     "practiceArea" TEXT,
ADD COLUMN     "sourceType" TEXT;

CREATE INDEX "legal_research_notes_caseId_idx" ON "legal_research_notes"("caseId");

ALTER TABLE "legal_research_notes" ADD CONSTRAINT "legal_research_notes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "legal_research_notes" ADD CONSTRAINT "legal_research_notes_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
