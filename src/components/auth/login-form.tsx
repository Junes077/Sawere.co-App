"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED === "true";
const MICROSOFT_ENABLED = process.env.NEXT_PUBLIC_MICROSOFT_LOGIN_ENABLED === "true";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const redirectTo = searchParams.get("redirectTo") || "/dashboard";
    router.push(redirectTo);
    router.refresh();
  }

  async function handleOAuth(provider: "google" | "azure") {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to your firm workspace.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@sawereadvocates.com"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/reset-password" className="text-xs text-accent hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" disabled={loading} className="mt-1">
          {loading && <Loader2 className="animate-spin" />}
          Sign in
        </Button>
      </form>

      {(GOOGLE_ENABLED || MICROSOFT_ENABLED) && (
        <>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            or continue with
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {GOOGLE_ENABLED && (
              <Button variant="outline" type="button" onClick={() => handleOAuth("google")}>
                Google
              </Button>
            )}
            {MICROSOFT_ENABLED && (
              <Button variant="outline" type="button" onClick={() => handleOAuth("azure")}>
                Microsoft
              </Button>
            )}
          </div>
        </>
      )}

      <Button variant="ghost" type="button" className="text-muted-foreground" disabled>
        <Fingerprint />
        Sign in with biometrics (available on desktop &amp; mobile apps)
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        New to Sawere Legal OS?{" "}
        <Link href="/signup" className="font-medium text-accent hover:underline">
          Create your firm
        </Link>
      </p>
    </div>
  );
}
