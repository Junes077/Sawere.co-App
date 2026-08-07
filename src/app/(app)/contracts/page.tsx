import { FileSignature } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listClients } from "@/lib/data/clients";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TemplateFormDialog } from "@/components/contracts/template-form-dialog";
import { GenerateDraftDialog } from "@/components/contracts/generate-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function ContractsPage() {
  const user = await requireUser();
  const [templates, clients, cases] = await Promise.all([
    prisma.documentTemplate.findMany({ where: { firmId: user.firmId }, orderBy: { updatedAt: "desc" } }),
    listClients(user.firmId),
    prisma.case.findMany({ where: { firmId: user.firmId }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Contracts & Documents"
        description="Draft contracts, letters, demand notices and more in your firm's own style."
        actions={
          <>
            <TemplateFormDialog />
            <GenerateDraftDialog templates={templates} clients={clients} cases={cases} />
          </>
        }
      />

      {templates.length === 0 ? (
        <EmptyState
          icon={FileSignature}
          title="Add a template to start generating drafts"
          description="Upload an example contract, letter or affidavit — the AI will match its tone, structure and formatting."
          action={<TemplateFormDialog />}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <Card key={t.id}>
              <CardContent className="flex flex-col gap-2 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground">{t.name}</p>
                  <Badge variant="outline">{t.category}</Badge>
                </div>
                <p className="line-clamp-3 text-xs text-muted-foreground">{t.bodyMarkdown}</p>
                <p className="text-xs text-muted-foreground">Updated {formatDate(t.updatedAt)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
