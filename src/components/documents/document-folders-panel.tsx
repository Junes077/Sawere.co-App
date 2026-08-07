"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FolderPlus, FolderOpen, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DocumentFolder } from "@prisma/client";

export function DocumentFoldersPanel({ folders }: { folders: DocumentFolder[] }) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [path, setPath] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim() || !path.trim()) return;
    setLoading(true);

    const res = await fetch("/api/document-folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, path }),
    });

    setLoading(false);
    if (!res.ok) {
      toast.error("Couldn't add that folder");
      return;
    }
    setLabel("");
    setPath("");
    router.refresh();
  }

  async function handleRemove(id: string) {
    const res = await fetch(`/api/document-folders/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Couldn't remove that folder");
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold">
            <Sparkles className="size-5" />
          </span>
          <div>
            <p className="font-medium text-foreground">AI Document Brain — indexed folders</p>
            <p className="text-sm text-muted-foreground">
              Only folders you add here are ever read by the AI. Nothing on your machine is scanned
              automatically. Folder indexing (PDF/Word/Excel/image OCR, summarization, clause
              search) runs from the Windows desktop app once a folder is registered here.
            </p>
          </div>
        </div>

        <form onSubmit={handleAdd} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label, e.g. Contracts 2026" />
          <Input value={path} onChange={(e) => setPath(e.target.value)} placeholder="Folder path, e.g. D:\Firm\Contracts" />
          <Button type="submit" disabled={loading || !label.trim() || !path.trim()}>
            <FolderPlus /> Add folder
          </Button>
        </form>

        {folders.length > 0 && (
          <ul className="flex flex-col gap-2">
            {folders.map((folder) => (
              <li
                key={folder.id}
                className="flex items-center gap-3 rounded-lg border border-border p-3"
              >
                <FolderOpen className="size-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{folder.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{folder.path}</p>
                </div>
                <Badge variant={folder.isIndexed ? "success" : "outline"}>
                  {folder.isIndexed ? "Indexed" : "Pending desktop sync"}
                </Badge>
                <Button variant="ghost" size="icon" onClick={() => handleRemove(folder.id)} aria-label="Remove folder">
                  <Trash2 className="text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
