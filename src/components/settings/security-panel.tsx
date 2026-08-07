"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Fingerprint, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TwoFactorSetup } from "@/components/settings/two-factor-setup";
import type { User } from "@prisma/client";

const TIMEOUTS = [15, 30, 60, 120, 240];

export function SecurityPanel({ user }: { user: User }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [biometric, setBiometric] = useState(user.biometricEnabled);
  const [timeout_, setTimeout_] = useState(user.sessionTimeoutMinutes);

  async function updateProfile(patch: Record<string, unknown>) {
    setSaving(true);
    const res = await fetch("/api/settings/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Couldn't save security settings");
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
        <CardDescription>Encrypted at rest (AES-256 via Supabase). Every change here is written to the audit log.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <TwoFactorSetup />

        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            <Fingerprint className="size-5 text-muted-foreground" />
            <div>
              <p className="font-medium text-foreground">Biometric sign-in</p>
              <p className="text-xs text-muted-foreground">
                Uses Windows Hello / Android biometrics once you install the desktop or mobile app.
              </p>
            </div>
          </div>
          <Switch
            checked={biometric}
            onCheckedChange={(checked) => {
              setBiometric(checked);
              updateProfile({ biometricEnabled: checked });
            }}
            disabled={saving}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div>
            <p className="font-medium text-foreground">Session timeout</p>
            <p className="text-xs text-muted-foreground">Automatically sign out after a period of inactivity.</p>
          </div>
          <Select
            value={String(timeout_)}
            onValueChange={(v) => {
              const minutes = Number(v);
              setTimeout_(minutes);
              updateProfile({ sessionTimeoutMinutes: minutes });
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
              {saving && <Loader2 className="ml-1 size-3 animate-spin" />}
            </SelectTrigger>
            <SelectContent>
              {TIMEOUTS.map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {m} minutes
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
