"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

type Factor = { id: string; friendly_name?: string | null; status: string };

export function TwoFactorSetup() {
  const router = useRouter();
  const [factors, setFactors] = useState<Factor[] | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [pendingFactorId, setPendingFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refreshFactors();
  }, []);

  async function refreshFactors() {
    const supabase = createClient();
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors(data?.totp ?? []);
  }

  async function syncFlag(enabled: boolean) {
    await fetch("/api/settings/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ twoFactorEnabled: enabled }),
    });
    router.refresh();
  }

  async function startEnroll() {
    setEnrolling(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    setEnrolling(false);

    if (error || !data) {
      toast.error(error?.message ?? "Couldn't start 2FA setup");
      return;
    }
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
    setPendingFactorId(data.id);
  }

  async function verifyEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (!pendingFactorId || code.length < 6) return;
    setLoading(true);

    const supabase = createClient();
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId: pendingFactorId,
    });
    if (challengeError || !challenge) {
      toast.error(challengeError?.message ?? "Couldn't verify code");
      setLoading(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: pendingFactorId,
      challengeId: challenge.id,
      code,
    });

    setLoading(false);
    if (verifyError) {
      toast.error(verifyError.message);
      return;
    }

    toast.success("Two-factor authentication enabled");
    setQrCode(null);
    setSecret(null);
    setPendingFactorId(null);
    setCode("");
    await syncFlag(true);
    await refreshFactors();
  }

  async function handleUnenroll(factorId: string) {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Two-factor authentication disabled");
    await syncFlag(false);
    await refreshFactors();
  }

  if (factors === null) {
    return <Loader2 className="size-4 animate-spin text-muted-foreground" />;
  }

  const verifiedFactor = factors.find((f) => f.status === "verified");

  if (verifiedFactor) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-border p-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-5 text-success" />
          <div>
            <p className="font-medium text-foreground">Two-factor authentication is on</p>
            <p className="text-xs text-muted-foreground">Authenticator app enrolled.</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => handleUnenroll(verifiedFactor.id)} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <ShieldOff />}
          Disable
        </Button>
      </div>
    );
  }

  if (qrCode) {
    return (
      <form onSubmit={verifyEnroll} className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <p className="text-sm text-foreground">
          Scan this QR code with an authenticator app (Google Authenticator, Authy, 1Password…), then
          enter the 6-digit code below.
        </p>
        <div
          className="mx-auto w-40 [&_svg]:w-full"
          dangerouslySetInnerHTML={{ __html: qrCode }}
        />
        {secret && (
          <p className="text-center text-xs text-muted-foreground">
            Can&apos;t scan? Enter this key manually: <code className="font-mono">{secret}</code>
          </p>
        )}
        <div className="flex gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            className="text-center tracking-widest"
          />
          <Button type="submit" disabled={loading || code.length < 6}>
            {loading && <Loader2 className="animate-spin" />}
            Verify
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-4">
      <div>
        <p className="font-medium text-foreground">Two-factor authentication is off</p>
        <p className="text-xs text-muted-foreground">Add an authenticator app for an extra layer of security.</p>
      </div>
      <Button size="sm" onClick={startEnroll} disabled={enrolling}>
        {enrolling && <Loader2 className="animate-spin" />}
        Enable 2FA
      </Button>
    </div>
  );
}
