"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AiSummaryCard({ caseId, summary }: { caseId: string; summary: string | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    const res = await fetch(`/api/cases/${caseId}/ai-summary`, { method: "POST" });
    const json = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      toast.error(json.error ?? "Couldn't generate a summary.");
      return;
    }
    toast.success("Summary updated");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4 text-gold" /> AI case summary
        </CardTitle>
        <Button variant="outline" size="sm" onClick={generate} disabled={loading}>
          {loading && <Loader2 className="animate-spin" />}
          {summary ? "Regenerate" : "Generate"}
        </Button>
      </CardHeader>
      <CardContent>
        {summary ? (
          <p className="whitespace-pre-line text-sm text-foreground/90">{summary}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Generate an AI summary from this case&apos;s notes, deadlines and documents.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
