"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FolderUp, Loader2, CheckCircle2, XCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/client";
import { DOCUMENTS_BUCKET } from "@/lib/data/documents";
import { DOCUMENT_CATEGORIES } from "@/lib/validators/document";
import { formatBytes } from "@/lib/utils";
import type { Client, Case } from "@prisma/client";

const IGNORED_FILENAMES = new Set([".DS_Store", "Thumbs.db", "desktop.ini"]);

type QueuedFile = {
  file: File;
  relativePath: string;
  status: "queued" | "uploading" | "done" | "error";
  error?: string;
};

export function BulkUploadDialog({
  firmId,
  clients,
  cases,
}: {
  firmId: string;
  clients: Client[];
  cases: Case[];
}) {
  const router = useRouter();
  const dirInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [category, setCategory] = useState("OTHER");
  const [clientId, setClientId] = useState("");
  const [caseId, setCaseId] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    dirInputRef.current?.setAttribute("webkitdirectory", "");
    dirInputRef.current?.setAttribute("directory", "");
  }, []);

  const filteredCases = clientId ? cases.filter((c) => c.clientId === clientId) : cases;
  const doneCount = useMemo(() => queue.filter((q) => q.status === "done").length, [queue]);
  const errorCount = useMemo(() => queue.filter((q) => q.status === "error").length, [queue]);

  function handleFolderSelected(fileList: FileList | null) {
    if (!fileList) return;
    const files = Array.from(fileList).filter(
      (f) => f.size > 0 && !IGNORED_FILENAMES.has(f.name),
    );
    setQueue(
      files.map((file) => ({
        file,
        relativePath: (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name,
        status: "queued",
      })),
    );
  }

  function removeFile(index: number) {
    setQueue((q) => q.filter((_, i) => i !== index));
  }

  async function handleUpload() {
    if (queue.length === 0) return;
    setUploading(true);
    const supabase = createClient();

    const total = queue.length;
    let failed = 0;

    for (let i = 0; i < total; i += 1) {
      setQueue((q) => q.map((item, idx) => (idx === i ? { ...item, status: "uploading" } : item)));

      try {
        const { file } = queue[i];
        const path = `${firmId}/${crypto.randomUUID()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(path, file);
        if (uploadError) throw new Error(uploadError.message);

        const res = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            storagePath: path,
            mimeType: file.type || "application/octet-stream",
            sizeBytes: file.size,
            category,
            clientId: clientId || undefined,
            caseId: caseId || undefined,
          }),
        });

        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error ?? "Upload failed");
        }

        setQueue((q) => q.map((item, idx) => (idx === i ? { ...item, status: "done" } : item)));
      } catch (err) {
        failed += 1;
        setQueue((q) =>
          q.map((item, idx) =>
            idx === i
              ? { ...item, status: "error", error: err instanceof Error ? err.message : "Upload failed" }
              : item,
          ),
        );
      }
    }

    setUploading(false);
    router.refresh();

    const succeeded = total - failed;
    if (failed === 0) {
      toast.success(`Uploaded ${succeeded} file${succeeded === 1 ? "" : "s"}`);
    } else {
      toast.error(`Uploaded ${succeeded} of ${total} files — ${failed} failed`);
    }
  }

  function handleClose(next: boolean) {
    setOpen(next);
    if (!next) {
      setQueue([]);
      setCategory("OTHER");
      setClientId("");
      setCaseId("");
    }
  }

  const allDone = queue.length > 0 && queue.every((q) => q.status === "done" || q.status === "error");

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FolderUp /> Upload folder
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload a folder</DialogTitle>
        </DialogHeader>

        <input
          ref={dirInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFolderSelected(e.target.files)}
        />

        <div className="flex flex-col gap-4">
          {queue.length === 0 ? (
            <Button type="button" variant="outline" onClick={() => dirInputRef.current?.click()}>
              <FolderUp /> Select a folder
            </Button>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {queue.length} file{queue.length === 1 ? "" : "s"} found. The category, client and case
                below will be applied to all of them.
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory} disabled={uploading}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Client (optional)</Label>
                  <Select
                    value={clientId || "none"}
                    onValueChange={(v) => setClientId(v === "none" ? "" : v)}
                    disabled={uploading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Case (optional)</Label>
                  <Select
                    value={caseId || "none"}
                    onValueChange={(v) => setCaseId(v === "none" ? "" : v)}
                    disabled={uploading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {filteredCases.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <ScrollArea className="h-64 rounded-md border border-border">
                <div className="flex flex-col divide-y divide-border">
                  {queue.map((item, i) => (
                    <div key={`${item.relativePath}-${i}`} className="flex items-center gap-2 px-3 py-2 text-sm">
                      {item.status === "queued" && <div className="size-4 shrink-0 rounded-full border border-border" />}
                      {item.status === "uploading" && <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />}
                      {item.status === "done" && <CheckCircle2 className="size-4 shrink-0 text-success" />}
                      {item.status === "error" && <XCircle className="size-4 shrink-0 text-destructive" />}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-foreground">{item.relativePath}</p>
                        {item.error ? (
                          <p className="truncate text-xs text-destructive">{item.error}</p>
                        ) : (
                          <p className="text-xs text-muted-foreground">{formatBytes(item.file.size)}</p>
                        )}
                      </div>
                      {item.status === "queued" && !uploading && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-6 shrink-0"
                          onClick={() => removeFile(i)}
                          aria-label="Remove file"
                        >
                          <X className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {allDone && (
                <p className="text-sm text-muted-foreground">
                  Done — {doneCount} uploaded{errorCount > 0 ? `, ${errorCount} failed` : ""}.
                </p>
              )}
            </>
          )}
        </div>

        {queue.length > 0 && (
          <DialogFooter>
            {allDone ? (
              <Button type="button" onClick={() => handleClose(false)}>
                Close
              </Button>
            ) : (
              <Button type="button" onClick={handleUpload} disabled={uploading || queue.length === 0}>
                {uploading && <Loader2 className="animate-spin" />}
                Upload {queue.length} file{queue.length === 1 ? "" : "s"}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
