"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Firm } from "@prisma/client";

export function FirmForm({ firm, editable }: { firm: Firm; editable: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: firm.name,
    address: firm.address ?? "",
    phone: firm.phone ?? "",
    email: firm.email ?? "",
    website: firm.website ?? "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/settings/firm", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);
    if (!res.ok) {
      toast.error("Couldn't update firm details");
      return;
    }
    toast.success("Firm details updated");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Firm details</CardTitle>
      </CardHeader>
      <CardContent>
        <fieldset disabled={!editable} className="contents">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Firm name</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={form.website}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Firm email</Label>
                <Input
                  id="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="phone">Firm phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="col-span-1 flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                />
              </div>
            </div>
            {editable ? (
              <Button type="submit" disabled={loading} className="self-start">
                {loading && <Loader2 className="animate-spin" />}
                Save firm details
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">Only firm owners or admins can edit these details.</p>
            )}
          </form>
        </fieldset>
      </CardContent>
    </Card>
  );
}
