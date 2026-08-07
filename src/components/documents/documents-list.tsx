"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Trash2, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate } from "@/lib/utils";
import type { Client, Case, Document, User } from "@prisma/client";

type DocumentRow = Document & { client: Client | null; case: Case | null; uploadedBy: User | null };

export function DocumentsList({ documents }: { documents: DocumentRow[] }) {
  const router = useRouter();

  async function handleDownload(id: string) {
    const res = await fetch(`/api/documents/${id}/signed-url`);
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.url) {
      toast.error(json.error ?? "Couldn't generate a download link");
      return;
    }
    window.open(json.url, "_blank", "noopener,noreferrer");
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Couldn't delete the document");
      return;
    }
    toast.success("Document deleted");
    router.refresh();
  }

  if (documents.length === 0) {
    return <EmptyState icon={FileText} title="No documents yet" description="Upload a file to get started." />;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {documents.map((doc) => (
        <Card key={doc.id}>
          <CardContent className="flex flex-col gap-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                <FileText className="size-4" />
              </span>
              <Badge variant="outline">{doc.category.replace("_", " ")}</Badge>
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground" title={doc.fileName}>
                {doc.fileName}
              </p>
              <p className="text-xs text-muted-foreground">
                {doc.client?.fullName ?? doc.case?.title ?? "Unlinked"} · {formatDate(doc.createdAt)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => handleDownload(doc.id)}>
                <Download /> Open
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)} aria-label="Delete">
                <Trash2 className="text-destructive" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
