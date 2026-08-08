"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export function RecordingPlayer({ recordingId }: { recordingId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/recordings/${recordingId}/signed-url`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setUrl(typeof data.url === "string" ? data.url : null);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [recordingId]);

  if (loading) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin" /> Loading recording…
      </p>
    );
  }

  if (!url) {
    return <p className="text-xs text-destructive">Couldn&apos;t load the recording</p>;
  }

  return <audio controls src={url} className="h-9 w-full max-w-sm" />;
}
