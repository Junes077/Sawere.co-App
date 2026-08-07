import { notFound } from "next/navigation";
import Link from "next/link";
import { Mail, Phone, MapPin, IdCard, Building2, ArrowRight, FileText, Receipt, Video } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getClientDetail } from "@/lib/data/clients";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ClientFormDialog } from "@/components/clients/client-form-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatDate, initials } from "@/lib/utils";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const client = await getClientDetail(user.firmId, id);

  if (!client) notFound();

  return (
    <div>
      <PageHeader
        title={client.fullName}
        description={client.companyName ?? undefined}
        actions={<ClientFormDialog client={client} />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col gap-4 p-6">
            <div className="flex items-center gap-3">
              <Avatar className="size-14">
                <AvatarFallback className="text-lg">{initials(client.fullName)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-serif text-lg text-foreground">{client.fullName}</p>
                <Badge variant="outline">{client.clientType}</Badge>
              </div>
            </div>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              {client.email && (
                <p className="flex items-center gap-2">
                  <Mail className="size-4" /> {client.email}
                </p>
              )}
              {client.phone && (
                <p className="flex items-center gap-2">
                  <Phone className="size-4" /> {client.phone}
                </p>
              )}
              {client.address && (
                <p className="flex items-center gap-2">
                  <MapPin className="size-4" /> {client.address}
                </p>
              )}
              {client.nationalId && (
                <p className="flex items-center gap-2">
                  <IdCard className="size-4" /> {client.nationalId}
                </p>
              )}
              {client.companyName && (
                <p className="flex items-center gap-2">
                  <Building2 className="size-4" /> {client.companyName}
                </p>
              )}
            </div>
            {client.notes && (
              <div className="border-t border-border pt-3 text-sm text-foreground/90">{client.notes}</div>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Tabs defaultValue="cases">
            <TabsList>
              <TabsTrigger value="cases">Cases ({client.cases.length})</TabsTrigger>
              <TabsTrigger value="documents">Documents ({client.documents.length})</TabsTrigger>
              <TabsTrigger value="meetings">Meetings ({client.meetings.length})</TabsTrigger>
              <TabsTrigger value="invoices">Invoices ({client.invoices.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="cases" className="mt-4">
              {client.cases.length === 0 ? (
                <EmptyState icon={FileText} title="No cases yet" />
              ) : (
                <div className="flex flex-col gap-3">
                  {client.cases.map((c) => (
                    <Link key={c.id} href={`/cases/${c.id}`}>
                      <Card className="transition-colors hover:border-accent">
                        <CardContent className="flex items-center justify-between p-4">
                          <div>
                            <p className="font-medium text-foreground">{c.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {c.caseNumber} · {c.caseType}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{c.status.replace("_", " ")}</Badge>
                            <ArrowRight className="size-4 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="documents" className="mt-4">
              {client.documents.length === 0 ? (
                <EmptyState icon={FileText} title="No documents yet" description="Upload files from the Documents module." />
              ) : (
                <div className="flex flex-col gap-2">
                  {client.documents.map((doc) => (
                    <Card key={doc.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <FileText className="size-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-foreground">{doc.fileName}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(doc.createdAt)}</p>
                          </div>
                        </div>
                        <Badge variant="outline">{doc.category.replace("_", " ")}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="meetings" className="mt-4">
              {client.meetings.length === 0 ? (
                <EmptyState icon={Video} title="No meetings recorded yet" />
              ) : (
                <div className="flex flex-col gap-2">
                  {client.meetings.map((m) => (
                    <Card key={m.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-foreground">{m.title}</p>
                          <Badge variant="outline">{m.type.replace("_", " ")}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{formatDate(m.startedAt)}</p>
                        {m.recording?.transcript?.summary && (
                          <p className="mt-2 text-sm text-foreground/90">{m.recording.transcript.summary}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="invoices" className="mt-4">
              {client.invoices.length === 0 ? (
                <EmptyState icon={Receipt} title="No invoices yet" />
              ) : (
                <div className="flex flex-col gap-2">
                  {client.invoices.map((inv) => (
                    <Card key={inv.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-medium text-foreground">{inv.invoiceNumber}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(inv.issueDate)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {formatCurrency(Number(inv.total), inv.currency)}
                          </span>
                          <Badge variant={inv.status === "PAID" ? "success" : "outline"}>{inv.status}</Badge>
                        </div>
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
