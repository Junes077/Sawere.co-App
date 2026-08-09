"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, BookmarkPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import type { Client, Case } from "@prisma/client";

export function SaveResultDialog({
  title,
  sourceUrl,
  jurisdiction,
  practiceArea,
  sourceType,
  clients,
  cases,
}: {
  title: string;
  sourceUrl: string;
  jurisdiction: string;
  practiceArea?: string;
  sourceType?: string;
  clients: Client[];
  cases: Case[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState("");
  const [caseId, setCaseId] = useState("");
  const [summary, setSummary] = useState("");

  const filteredCases = clientId ? cases.filter((c) => c.clientId === clientId) : cases;

  async function handleSave() {
    setLoading(true);
    const res = await fetch("/api/legal-research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        sourceUrl,
        jurisdiction,
        practiceArea,
        sourceType,
        summary,
        clientId: clientId || undefined,
        caseId: caseId || undefined,
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      toast.error(json.error ?? "Couldn't save this result");
      return;
    }
    toast.success("Saved to research");
    setOpen(false);
    setSummary("");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <BookmarkPlus /> Save
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save to research</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <p className="line-clamp-2 text-sm text-foreground">{title}</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Client (optional)</Label>
              <Select value={clientId || "none"} onValueChange={(v) => setClientId(v === "none" ? "" : v)}>
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
              <Select value={caseId || "none"} onValueChange={(v) => setCaseId(v === "none" ? "" : v)}>
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
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="summary">Note (optional)</Label>
            <Textarea
              id="summary"
              rows={3}
              placeholder="Why this matters, key principle, etc."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
