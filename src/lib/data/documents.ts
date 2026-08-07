import { prisma } from "@/lib/prisma";

export const DOCUMENTS_BUCKET = "documents";

export async function listDocuments(firmId: string, opts: { search?: string; clientId?: string; caseId?: string }) {
  return prisma.document.findMany({
    where: {
      firmId,
      ...(opts.clientId ? { clientId: opts.clientId } : {}),
      ...(opts.caseId ? { caseId: opts.caseId } : {}),
      ...(opts.search ? { fileName: { contains: opts.search, mode: "insensitive" } } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { client: true, case: true, uploadedBy: true },
  });
}

export async function listDocumentFolders(firmId: string) {
  return prisma.documentFolder.findMany({ where: { firmId }, orderBy: { createdAt: "desc" } });
}
