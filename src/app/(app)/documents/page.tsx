import { requireUser } from "@/lib/auth";
import { listDocuments, listDocumentFolders } from "@/lib/data/documents";
import { listClients } from "@/lib/data/clients";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { SearchBox } from "@/components/shared/search-box";
import { UploadDocumentDialog } from "@/components/documents/upload-dialog";
import { DocumentsList } from "@/components/documents/documents-list";
import { DocumentFoldersPanel } from "@/components/documents/document-folders-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireUser();
  const { q } = await searchParams;

  const [documents, folders, clients, cases] = await Promise.all([
    listDocuments(user.firmId, { search: q }),
    listDocumentFolders(user.firmId),
    listClients(user.firmId),
    prisma.case.findMany({ where: { firmId: user.firmId }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Contracts, filings, evidence and correspondence — all searchable in one vault."
        actions={<UploadDocumentDialog firmId={user.firmId} clients={clients} cases={cases} />}
      />

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All documents</TabsTrigger>
          <TabsTrigger value="folders">AI indexed folders</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <div className="mb-4">
            <SearchBox placeholder="Search documents by file name…" />
          </div>
          <DocumentsList documents={documents} />
        </TabsContent>
        <TabsContent value="folders" className="mt-4">
          <DocumentFoldersPanel folders={folders} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
