"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Sparkles, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import type { DocumentTemplate, Client, Case } from "@prisma/client";

export function GenerateDraftDialog({
  templates,
  clients,
  cases,
}: {
  templates: DocumentTemplate[];
  clients: Client[];
  cases: Case[];
}) {
  const [open, setOpen] = useState(false);
  const [templateId, setTemplateId] = useState("");
  const [clientId, setClientId] = useState("");
  const [caseId, setCaseId] = useState("");
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);

  async function handleGenerate() {
    if (!templateId || !instructions.trim()) return;
    setLoading(true);
    setDraft(null);

    const res = await fetch("/api/contracts/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId, instructions, clientId, caseId }),
    });
    const json = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      toast.error(json.error ?? "Couldn't generate a draft");
      return;
    }
    setDraft(json.draft);
  }

  function copyDraft() {
    if (!draft) return;
    navigator.clipboard.writeText(draft);
    toast.success("Draft copied to clipboard");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setDraft(null);
      }}
    >
      <DialogTrigger asChild>
        <Button disabled={templates.length === 0}>
          <Sparkles /> Generate with AI
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate a draft</DialogTitle>
        </DialogHeader>

        {!draft ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Template</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} · {t.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                    {cases.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="instructions">What should this draft say?</Label>
              <Textarea
                id="instructions"
                rows={5}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Demand notice for unpaid rent of KES 150,000, tenant has 14 days to settle before eviction proceedings."
              />
            </div>
            <DialogFooter>
              <Button onClick={handleGenerate} disabled={loading || !templateId || !instructions.trim()}>
                {loading && <Loader2 className="animate-spin" />}
                Generate draft
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Textarea readOnly rows={16} value={draft} className="font-mono text-xs" />
            <DialogFooter>
              <Button variant="outline" onClick={() => setDraft(null)}>
                Back
              </Button>
              <Button onClick={copyDraft}>
                <Copy /> Copy draft
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
