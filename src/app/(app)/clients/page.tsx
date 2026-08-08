import Link from "next/link";
import { Suspense } from "react";
import { Users, Building2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listClients } from "@/lib/data/clients";
import { PageHeader } from "@/components/shared/page-header";
import { SearchBox } from "@/components/shared/search-box";
import { EmptyState } from "@/components/shared/empty-state";
import { ClientFormDialog } from "@/components/clients/client-form-dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { initials } from "@/lib/utils";
import { getDictionary, getUserLocale } from "@/lib/i18n";

async function ClientsList({ firmId, q }: { firmId: string; q?: string }) {
  const clients = await listClients(firmId, q);

  if (clients.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title={q ? "No clients match your search" : "No clients yet"}
        description={q ? "Try a different name, email or phone number." : "Add your first client to get started."}
        action={!q ? <ClientFormDialog /> : undefined}
      />
    );
  }

  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Cases</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id} className="cursor-pointer">
              <TableCell>
                <Link href={`/clients/${client.id}`} className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{initials(client.fullName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{client.fullName}</p>
                    {client.companyName && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Building2 className="size-3" /> {client.companyName}
                      </p>
                    )}
                  </div>
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {client.email && <p>{client.email}</p>}
                {client.phone && <p>{client.phone}</p>}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{client.clientType}</Badge>
              </TableCell>
              <TableCell>{client._count.cases}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireUser();
  const { q } = await searchParams;
  const dict = getDictionary(getUserLocale(user.preferences));

  return (
    <div>
      <PageHeader
        title={dict.pages.clients.title}
        description={dict.pages.clients.description}
        actions={<ClientFormDialog />}
      />
      <div className="mb-4">
        <SearchBox placeholder="Search clients by name, email or phone…" />
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading clients…</p>}>
        <ClientsList firmId={user.firmId} q={q} />
      </Suspense>
    </div>
  );
}
