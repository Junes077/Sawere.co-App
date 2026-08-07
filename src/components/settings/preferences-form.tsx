"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMounted } from "@/hooks/use-mounted";
import type { User } from "@prisma/client";

type Prefs = { language?: "en" | "sw"; notifications?: { email?: boolean; push?: boolean; desktop?: boolean } };

export function PreferencesForm({ user }: { user: User }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const prefs = (user.preferences as Prefs) ?? {};
  const [language, setLanguage] = useState(prefs.language ?? "en");
  const [notifications, setNotifications] = useState({
    email: prefs.notifications?.email ?? true,
    push: prefs.notifications?.push ?? true,
    desktop: prefs.notifications?.desktop ?? true,
  });

  async function persist(patch: Record<string, unknown>) {
    const res = await fetch("/api/settings/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      toast.error("Couldn't save preferences");
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <Label>Appearance</Label>
          {mounted && (
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <Label>Language</Label>
          <Select
            value={language}
            onValueChange={(v) => {
              setLanguage(v as "en" | "sw");
              persist({ language: v });
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="sw">Kiswahili</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg border border-border p-4">
          <p className="mb-3 font-medium text-foreground">Notifications</p>
          <div className="flex flex-col gap-3">
            {(["email", "push", "desktop"] as const).map((channel) => (
              <div key={channel} className="flex items-center justify-between">
                <Label className="capitalize text-muted-foreground">{channel} reminders</Label>
                <Switch
                  checked={notifications[channel]}
                  onCheckedChange={(checked) => {
                    const next = { ...notifications, [channel]: checked };
                    setNotifications(next);
                    persist({ notifications: next });
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
