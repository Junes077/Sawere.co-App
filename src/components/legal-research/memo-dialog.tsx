"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, FileText, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { LegalResearchNote } from "@prisma/client";

export function MemoDialog({ notes }: { notes: LegalResearchNote[] }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [memo, setMemo] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleGenerate() {
    setLoading(true);
    setMemo(null);
    const res = await fetch("/api/legal-research/memo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, noteIds: Array.from(selected) }),
    });
    const json = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      toast.error(json.error ?? "Couldn't generate the memo");
      return;
    }
    setMemo(json.memo);
  }

  async function copyMemo() {
    if (!memo) return;
    await navigator.clipboard.writeText(memo);
    toast.success("Memo copied");
  }

  function handleClose(next: boolean) {
    setOpen(next);
    if (!next) {
      setQuestion("");
      setSelected(new Set());
      setMemo(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={notes.length === 0}>
          <FileText /> Generate research memo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate a research memo</DialogTitle>
        </DialogHeader>

        {memo ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-warning">AI-generated draft — advocate review required.</p>
              <Button type="button" variant="ghost" size="sm" onClick={copyMemo}>
                <Copy /> Copy
              </Button>
            </div>
            <ScrollArea className="h-96 rounded-md border border-border p-3">
              <pre className="whitespace-pre-wrap font-sans text-sm text-foreground">{memo}</pre>
            </ScrollArea>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setMemo(null)}>
                Back
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="question">Research question</Label>
              <Textarea
                id="question"
                rows={2}
                required
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. Can a village council unilaterally revoke a customary land grant?"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Sources to draw from ({selected.size} selected)</Label>
              <ScrollArea className="h-56 rounded-md border border-border">
                <div className="flex flex-col divide-y divide-border">
                  {notes.map((n) => (
                    <label key={n.id} className="flex cursor-pointer items-start gap-2 px-3 py-2 text-sm">
                      <Checkbox
                        checked={selected.has(n.id)}
                        onCheckedChange={() => toggle(n.id)}
                        className="mt-0.5"
                      />
                      <span className="text-foreground">{n.title}</span>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <p className="text-xs text-muted-foreground">
              The memo is grounded only in the sources you select here — it won&apos;t invent cases or
              citations beyond what you&apos;ve saved.
            </p>
            <DialogFooter>
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={loading || !question.trim() || selected.size === 0}
              >
                {loading && <Loader2 className="animate-spin" />}
                Generate memo
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
