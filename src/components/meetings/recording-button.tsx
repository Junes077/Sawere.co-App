"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Mic, RotateCcw, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Recording, Transcript } from "@prisma/client";

const RECORDINGS_BUCKET = "recordings";
const MIME_CANDIDATES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];

function pickMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function extensionFor(mimeType: string) {
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("ogg")) return "ogg";
  return "webm";
}

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

type RecordingWithTranscript = Recording & { transcript: Transcript | null };

export function RecordingButton({
  meetingId,
  firmId,
  recording,
}: {
  meetingId: string;
  firmId: string;
  recording: RecordingWithTranscript | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "recording" | "uploading" | "transcribing">("idle");
  const [elapsed, setElapsed] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Recording isn't supported in this browser");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => void handleStop(mimeType || recorder.mimeType || "audio/webm");
      recorder.start();
      mediaRecorderRef.current = recorder;
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
      setStatus("recording");
    } catch {
      toast.error("Microphone access is required to record");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (timerRef.current) clearInterval(timerRef.current);
  }

  async function handleStop(mimeType: string) {
    setStatus("uploading");
    const blob = new Blob(chunksRef.current, { type: mimeType });
    const path = `${firmId}/${meetingId}/${crypto.randomUUID()}.${extensionFor(mimeType)}`;

    try {
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from(RECORDINGS_BUCKET)
        .upload(path, blob, { contentType: mimeType });
      if (uploadError) throw new Error(uploadError.message);

      const res = await fetch(`/api/meetings/${meetingId}/recording`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storagePath: path, mimeType, durationSeconds: elapsed }),
      });
      if (!res.ok) throw new Error("Could not save the recording");
      const { recording: created } = await res.json();

      await transcribe(created.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Recording failed");
      setStatus("idle");
      router.refresh();
    }
  }

  async function transcribe(recordingId: string) {
    setStatus("transcribing");
    try {
      const res = await fetch(`/api/recordings/${recordingId}/transcribe`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Transcription failed");
      }
      toast.success("Meeting transcribed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Transcription failed");
    } finally {
      setStatus("idle");
      router.refresh();
    }
  }

  if (status === "recording") {
    return (
      <Button variant="destructive" size="sm" onClick={stopRecording}>
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-white" />
        </span>
        Stop · {formatElapsed(elapsed)}
        <Square className="ml-0.5 size-3" />
      </Button>
    );
  }

  if (status === "uploading" || status === "transcribing") {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="animate-spin" />
        {status === "uploading" ? "Saving recording…" : "Transcribing…"}
      </Button>
    );
  }

  if (recording && recording.status !== "TRANSCRIBED") {
    return (
      <Button variant="outline" size="sm" onClick={() => transcribe(recording.id)}>
        <RotateCcw /> Retry transcription
      </Button>
    );
  }

  if (recording?.status === "TRANSCRIBED") {
    return (
      <Button variant="ghost" size="sm" onClick={startRecording} className="text-muted-foreground">
        <Mic /> Re-record
      </Button>
    );
  }

  return (
    <Button variant="gold" size="sm" onClick={startRecording}>
      <Mic /> Record
    </Button>
  );
}
