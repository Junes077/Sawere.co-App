import { notFound } from "next/navigation";
import Link from "next/link";
import { Gavel, Scale, User as UserIcon, FileText, Video, ListChecks } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getCaseDetail, listFirmAdvocates } from "@/lib/data/cases";
import { listClients } from "@/lib/data/clients";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { CaseFormDialog } from "@/components/cases/case-form-dialog";
import { AiSummaryCard } from "@/components/cases/ai-summary-card";
import { CaseNotes } from "@/components/cases/case-notes";
import { CaseDeadlines } from "@/components/cases/case-deadlines";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const [caseRecord, clients, advocates] = await Promise.all([
    getCaseDetail(user.firmId, id),
    listClients(user.firmId),
    listFirmAdvocates(user.firmId),
  ]);

  if (!caseRecord) notFound();

  return (
    <div>
      <PageHeader
        title={caseRecord.title}
        description={`${caseRecord.caseNumber} · ${caseRecord.caseType}`}
        actions={
          <>
            <Badge
              variant={
                caseRecord.status === "WON"
                  ? "success"
                  : caseRecord.status === "LOST"
                    ? "destructive"
                    : "outline"
              }
              className="mr-2"
            >
              {caseRecord.status.replace("_", " ")}
            </Badge>
            <CaseFormDialog clients={clients} advocates={advocates} caseRecord={caseRecord} />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-1">
          <Card>
            <CardContent className="flex flex-col gap-3 p-6 text-sm">
              <p className="flex items-center gap-2 text-muted-foreground">
                <UserIcon className="size-4" />
                <Link href={`/clients/${caseRecord.clientId}`} className="text-foreground hover:text-accent">
                  {caseRecord.client.fullName}
                </Link>
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Scale className="size-4" /> {caseRecord.advocate?.fullName ?? "Unassigned advocate"}
              </p>
              {caseRecord.court && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Gavel className="size-4" /> {caseRecord.court}
                  {caseRecord.judge && ` · ${caseRecord.judge}`}
                </p>
              )}
              {caseRecord.opposingParty && (
                <p className="text-muted-foreground">
                  <span className="text-xs uppercase tracking-wide">Opposing party</span>
                  <br />
                  {caseRecord.opposingParty}
                </p>
              )}
              <p className="text-xs text-muted-foreground">Opened {formatDate(caseRecord.createdAt)}</p>
            </CardContent>
          </Card>

          <AiSummaryCard caseId={caseRecord.id} summary={caseRecord.aiSummary} />
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="deadlines">
            <TabsList>
              <TabsTrigger value="deadlines">Deadlines</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="documents">Documents ({caseRecord.documents.length})</TabsTrigger>
              <TabsTrigger value="meetings">Meetings ({caseRecord.meetings.length})</TabsTrigger>
              <TabsTrigger value="tasks">Tasks ({caseRecord.tasks.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="deadlines" className="mt-4">
              <CaseDeadlines caseId={caseRecord.id} deadlines={caseRecord.deadlines} />
            </TabsContent>

            <TabsContent value="notes" className="mt-4">
              <CaseNotes caseId={caseRecord.id} notes={caseRecord.notes} />
            </TabsContent>

            <TabsContent value="documents" className="mt-4">
              {caseRecord.documents.length === 0 ? (
                <EmptyState icon={FileText} title="No documents yet" />
              ) : (
                <div className="flex flex-col gap-2">
                  {caseRecord.documents.map((doc) => (
                    <Card key={doc.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <FileText className="size-4 text-muted-foreground" />
                          <p className="font-medium text-foreground">{doc.fileName}</p>
                        </div>
                        <Badge variant="outline">{doc.category.replace("_", " ")}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="meetings" className="mt-4">
              {caseRecord.meetings.length === 0 ? (
                <EmptyState icon={Video} title="No meetings linked to this case" />
              ) : (
                <div className="flex flex-col gap-2">
                  {caseRecord.meetings.map((m) => (
                    <Card key={m.id}>
                      <CardContent className="p-4">
                        <p className="font-medium text-foreground">{m.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(m.startedAt)}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="tasks" className="mt-4">
              {caseRecord.tasks.length === 0 ? (
                <EmptyState icon={ListChecks} title="No tasks linked to this case" />
              ) : (
                <div className="flex flex-col gap-2">
                  {caseRecord.tasks.map((t) => (
                    <Card key={t.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <p className="font-medium text-foreground">{t.title}</p>
                        <Badge variant="outline">{t.status.replace("_", " ")}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
