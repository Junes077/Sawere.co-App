import { DatabaseBackup, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function BackupCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Backups &amp; data protection</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start gap-3 rounded-lg border border-border p-4">
          <DatabaseBackup className="mt-0.5 size-5 text-muted-foreground" />
          <div>
            <p className="font-medium text-foreground">Continuous cloud backups</p>
            <p className="text-sm text-muted-foreground">
              Your database is backed up automatically by Supabase (point-in-time recovery on Pro
              plans and above). Documents in Storage are replicated across availability zones.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-lg border border-border p-4">
          <ShieldCheck className="mt-0.5 size-5 text-muted-foreground" />
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground">Encryption</p>
            <Badge variant="gold">AES-256 at rest · TLS in transit</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
