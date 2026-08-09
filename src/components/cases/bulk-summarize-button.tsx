"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BulkSummarizeButton({ caseIds }: { caseIds: string[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  if (caseIds.length === 0) return null;

  async function handleClick() {
    setLoading(true);
    setProgress(0);
    let failed = 0;

    for (let i = 0; i < caseIds.length; i += 1) {
      const res = await fetch(`/api/cases/${caseIds[i]}/ai-summary`, { method: "POST" });
      if (!res.ok) failed += 1;
      setProgress(i + 1);
    }

    setLoading(false);
    router.refresh();

    const succeeded = caseIds.length - failed;
    if (failed === 0) {
      toast.success(`Summarized ${succeeded} case${succeeded === 1 ? "" : "s"}`);
    } else {
      toast.error(`Summarized ${succeeded} of ${caseIds.length} — ${failed} failed`);
    }
  }

  return (
    <Button variant="outline" onClick={handleClick} disabled={loading}>
      {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
      {loading ? `Summarizing ${progress}/${caseIds.length}…` : `Summarize ${caseIds.length} case${caseIds.length === 1 ? "" : "s"}`}
    </Button>
  );
}
