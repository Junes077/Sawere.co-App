"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, UserPlus, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { formatDateTime } from "@/lib/utils";
import type { UserRole } from "@prisma/client";

const ROLES: UserRole[] = ["OWNER", "ADMIN", "ADVOCATE", "PARALEGAL", "STAFF", "RESEARCHER", "READ_ONLY"];

type TeamUser = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  title: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
};

type PendingInvite = {
  id: string;
  email: string;
  role: UserRole;
  token: string;
  createdAt: Date;
  expiresAt: Date;
};

export function UsersPanel({
  currentUserId,
  users,
  invitations,
  isManager,
}: {
  currentUserId: string;
  users: TeamUser[];
  invitations: PendingInvite[];
  isManager: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<{ email: string; role: UserRole }>({ email: "", role: "ADVOCATE" });
  const [pendingRowId, setPendingRowId] = useState<string | null>(null);

  function inviteLink(token: string) {
    return `${window.location.origin}/signup?invite=${token}`;
  }

  async function copyLink(token: string) {
    await navigator.clipboard.writeText(inviteLink(token));
    toast.success("Invite link copied — share it with your teammate");
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/settings/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      toast.error(json.error ?? "Couldn't create the invite");
      return;
    }

    setOpen(false);
    setForm({ email: "", role: "ADVOCATE" });
    router.refresh();
    if (json.invitation?.token) {
      await copyLink(json.invitation.token);
    }
  }

  async function revokeInvite(id: string) {
    setPendingRowId(id);
    const res = await fetch(`/api/settings/invitations/${id}`, { method: "DELETE" });
    setPendingRowId(null);
    if (!res.ok) {
      toast.error("Couldn't revoke the invite");
      return;
    }
    toast.success("Invite revoked");
    router.refresh();
  }

  async function updateUser(id: string, data: { role?: UserRole; isActive?: boolean }) {
    setPendingRowId(id);
    const res = await fetch(`/api/settings/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));
    setPendingRowId(null);
    if (!res.ok) {
      toast.error(json.error ?? "Couldn't update this teammate");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Team</CardTitle>
          {isManager && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus /> Invite teammate
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle>Invite a teammate</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleInvite} className="flex flex-col gap-4">
                  <p className="text-sm text-muted-foreground">
                    No email is sent automatically — you&apos;ll get a link to share yourself (WhatsApp,
                    email, whatever works).
                  </p>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="invite-email">Email</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="deo@sawereadvocates.com"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Role</Label>
                    <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v as UserRole }))}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={loading}>
                      {loading && <Loader2 className="animate-spin" />}
                      Create invite link
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last login</TableHead>
                {isManager && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const isSelf = u.id === currentUserId;
                const disabled = !isManager || isSelf || pendingRowId === u.id;
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium text-foreground">
                      {u.fullName} {isSelf && <Badge variant="outline" className="ml-1">You</Badge>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      {isManager ? (
                        <Select
                          value={u.role}
                          onValueChange={(v) => updateUser(u.id, { role: v as UserRole })}
                          disabled={disabled}
                        >
                          <SelectTrigger size="sm" className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map((r) => (
                              <SelectItem key={r} value={r}>
                                {r.replace("_", " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline">{u.role.replace("_", " ")}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.isActive ? "outline" : "destructive"}>
                        {u.isActive ? "Active" : "Deactivated"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "Never"}
                    </TableCell>
                    {isManager && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={disabled}
                          onClick={() => updateUser(u.id, { isActive: !u.isActive })}
                        >
                          {u.isActive ? "Deactivate" : "Reactivate"}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {isManager && invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending invites</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="text-foreground">{inv.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{inv.role.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(inv.expiresAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => copyLink(inv.token)} aria-label="Copy invite link">
                          <Copy />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={pendingRowId === inv.id}
                          onClick={() => revokeInvite(inv.id)}
                          aria-label="Revoke invite"
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
