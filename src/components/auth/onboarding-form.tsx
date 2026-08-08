"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OnboardingForm({
  defaultFullName,
  email,
}: {
  defaultFullName: string;
  email: string;
}) {
  const router = useRouter();
  const [firmName, setFirmName] = useState("");
  const [fullName, setFullName] = useState(defaultFullName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const res = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firmName, fullName }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Something went wrong.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error && err.name === "AbortError"
          ? "The server took too long to respond. Please try again."
          : "Couldn't reach the server. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground">One more step</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Signed in as {email}. Set up your firm workspace to continue.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="firmName">Firm name</Label>
          <Input
            id="firmName"
            required
            value={firmName}
            onChange={(e) => setFirmName(e.target.value)}
            placeholder="Sawere & Company Advocates"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fullName">Your full name</Label>
          <Input
            id="fullName"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Sawere"
          />
        </div>
        {error && (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="animate-spin" />}
          Continue
        </Button>
      </form>
    </div>
  );
}
