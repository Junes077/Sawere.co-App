import { BookOpenText, Sparkles, ExternalLink } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { NoteFormDialog } from "@/components/legal-research/note-form-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function LegalResearchPage() {
  const user = await requireUser();
  const notes = await prisma.legalResearchNote.findMany({
    where: { firmId: user.firmId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Legal Research"
        description="Pin judgments, statutes and principles your team relies on."
        actions={<NoteFormDialog />}
      />

      <Card className="mb-6 border-gold/30 bg-gold/5">
        <CardContent className="flex items-start gap-3 p-4 text-sm">
          <Sparkles className="mt-0.5 size-5 text-gold" />
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Live case-law search, judgment tracking and
            jurisdiction filters are on the roadmap.</span> Your saved notes below are already
            available as context to the AI Assistant.
          </p>
        </CardContent>
      </Card>

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
