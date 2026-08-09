import { BookOpenText, ExternalLink } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listClients } from "@/lib/data/clients";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { NoteFormDialog } from "@/components/legal-research/note-form-dialog";
import { SearchPanel } from "@/components/legal-research/search-panel";
import { MemoDialog } from "@/components/legal-research/memo-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { getDictionary, getUserLocale } from "@/lib/i18n";

export default async function LegalResearchPage() {
  const user = await requireUser();
  const dict = getDictionary(getUserLocale(user.preferences));

  const [notes, clients, cases] = await Promise.all([
    prisma.legalResearchNote.findMany({
      where: { firmId: user.firmId },
      orderBy: { createdAt: "desc" },
    }),
    listClients(user.firmId),
    prisma.case.findMany({ where: { firmId: user.firmId }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title={dict.pages.legalResearch.title}
        description={dict.pages.legalResearch.description}
        actions={
          <>
            <MemoDialog notes={notes} />
            <NoteFormDialog />
          </>
        }
      />

      <div className="mb-6">
        <SearchPanel clients={clients} cases={cases} />
      </div>

      <h2 className="mb-3 font-serif text-lg text-foreground">Saved research</h2>
      {notes.length === 0 ? (
        <EmptyState icon={BookOpenText} title="No research notes yet" />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {notes.map((note) => (
            <Card key={note.id}>
              <CardContent className="flex flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-foreground">{note.title}</p>
                  {note.jurisdiction && <Badge variant="outline">{note.jurisdiction}</Badge>}
                </div>
                {(note.practiceArea || note.sourceType || note.court || note.citation) && (
                  <div className="flex flex-wrap gap-1.5">
                    {note.practiceArea && <Badge variant="secondary">{note.practiceArea}</Badge>}
                    {note.sourceType && <Badge variant="secondary">{note.sourceType.replace("_", " ")}</Badge>}
                    {note.court && <Badge variant="secondary">{note.court}</Badge>}
                    {note.citation && <Badge variant="secondary">{note.citation}</Badge>}
                  </div>
                )}
                {note.summary && <p className="text-sm text-muted-foreground">{note.summary}</p>}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatDate(note.createdAt)}</span>
                  {note.sourceUrl && (
                    <a
                      href={note.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-accent hover:underline"
                    >
                      Source <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
