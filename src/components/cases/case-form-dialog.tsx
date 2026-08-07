"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Case, CaseStatus, Client, User } from "@prisma/client";

const STATUSES: CaseStatus[] = ["OPEN", "IN_PROGRESS", "ON_HOLD", "WON", "LOST", "SETTLED", "CLOSED"];

export function CaseFormDialog({
  clients,
  advocates,
  caseRecord,
  defaultClientId,
}: {
  clients: Client[];
  advocates: User[];
  caseRecord?: Case;
  defaultClientId?: string;
}) {
  const router = useRouter();
  const isEdit = Boolean(caseRecord);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    clientId: caseRecord?.clientId ?? defaultClientId ?? "",
    caseNumber: caseRecord?.caseNumber ?? "",
    title: caseRecord?.title ?? "",
    caseType: caseRecord?.caseType ?? "",
    status: caseRecord?.status ?? "OPEN",
    court: caseRecord?.court ?? "",
    judge: caseRecord?.judge ?? "",
    opposingParty: caseRecord?.opposingParty ?? "",
    advocateId: caseRecord?.advocateId ?? "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch(isEdit ? `/api/cases/${caseRecord!.id}` : "/api/cases", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      toast.error(json.error ?? "Something went wrong.");
      return;
    }

    toast.success(isEdit ? "Case updated" : "Case created");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="outline" size="sm">
            Edit
          </Button>
        ) : (
          <Button>
            <Plus /> New case
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit case" : "Open a new case"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label>Client</Label>
              <Select value={form.clientId} onValueChange={(v) => setForm((f) => ({ ...f, clientId: v }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="title">Case title</Label>
              <Input
                id="title"
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="caseNumber">Case number</Label>
              <Input
                id="caseNumber"
                required
                value={form.caseNumber}
                onChange={(e) => setForm((f) => ({ ...f, caseNumber: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="caseType">Case type</Label>
              <Input
                id="caseType"
                required
                placeholder="Civil, Criminal, Land…"
                value={form.caseType}
                onChange={(e) => setForm((f) => ({ ...f, caseType: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v as CaseStatus }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Advocate</Label>
              <Select
                value={form.advocateId || "unassigned"}
                onValueChange={(v) => setForm((f) => ({ ...f, advocateId: v === "unassigned" ? "" : v }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {advocates.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="court">Court</Label>
              <Input
                id="court"
                value={form.court}
                onChange={(e) => setForm((f) => ({ ...f, court: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="judge">Judge</Label>
              <Input
                id="judge"
                value={form.judge}
                onChange={(e) => setForm((f) => ({ ...f, judge: e.target.value }))}
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="opposingParty">Opposing party</Label>
              <Input
                id="opposingParty"
                value={form.opposingParty}
                onChange={(e) => setForm((f) => ({ ...f, opposingParty: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || !form.clientId}>
              {loading && <Loader2 className="animate-spin" />}
              {isEdit ? "Save changes" : "Create case"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
