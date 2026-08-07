"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignupForm() {
  const router = useRouter();
  const [form, setForm] = useState({ firmName: "", fullName: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    if (json.needsEmailConfirmation) {
      setNeedsConfirmation(true);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (needsConfirmation) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle2 className="size-10 text-success" />
        <h1 className="font-serif text-xl text-foreground">Check your inbox</h1>
        <p className="text-sm text-muted-foreground">
          We sent a confirmation link to <strong>{form.email}</strong>. Confirm your email to
          finish setting up {form.firmName}.
        </p>
        <Link href="/login" className="text-sm text-accent hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground">Set up your firm</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create the workspace for your practice. You&apos;ll be the firm owner.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="firmName">Firm name</Label>
          <Input
            id="firmName"
            required
            value={form.firmName}
            onChange={(e) => setForm((f) => ({ ...f, firmName: e.target.value }))}
            placeholder="Sawere & Company Advocates"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fullName">Your full name</Label>
          <Input
            id="fullName"
            required
            value={form.fullName}
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            placeholder="Jane Sawere"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="you@sawereadvocates.com"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="At least 8 characters"
          />
        </div>

        {error && (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" disabled={loading} className="mt-1">
          {loading && <Loader2 className="animate-spin" />}
          Create firm workspace
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have a workspace?{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
