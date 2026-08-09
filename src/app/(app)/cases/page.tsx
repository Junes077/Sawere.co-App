import Link from "next/link";
import { Briefcase } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listCases, listFirmAdvocates } from "@/lib/data/cases";
import { listClients } from "@/lib/data/clients";
import { PageHeader } from "@/components/shared/page-header";
import { SearchBox } from "@/components/shared/search-box";
import { EmptyState } from "@/components/shared/empty-state";
import { CaseFormDialog } from "@/components/cases/case-form-dialog";
import { BulkSummarizeButton } from "@/components/cases/bulk-summarize-button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CaseStatus } from "@prisma/client";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { getDictionary, getUserLocale } from "@/lib/i18n";

const STATUS_FILTERS: { label: string; value?: CaseStatus }[] = [
  { label: "All" },
  { label: "Open", value: "OPEN" },
  { label: "In progress", value: "IN_PROGRESS" },
  { label: "On hold", value: "ON_HOLD" },
  { label: "Won", value: "WON" },
  { label: "Lost", value: "LOST" },
  { label: "Closed", value: "CLOSED" },
];

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const user = await requireUser();
  const { q, status } = await searchParams;
  const dict = getDictionary(getUserLocale(user.preferences));

  const [cases, clients, advocates] = await Promise.all([
    listCases(user.firmId, { search: q, status: status as CaseStatus | undefined }),
    listClients(user.firmId),
    listFirmAdvocates(user.firmId),
  ]);

  return (
    <div>
      <PageHeader
        title={dict.pages.cases.title}
        description={dict.pages.cases.description}
        actions={
          <>
            <BulkSummarizeButton caseIds={cases.filter((c) => !c.aiSummary).map((c) => c.id)} />
            <CaseFormDialog clients={clients} advocates={advocates} />
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBox placeholder="Search by title, case number or client…" />
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((filter) => (
            <Link
              key={filter.label}
              href={{ pathname: "/cases", query: { ...(q ? { q } : {}), ...(filter.value ? { status: filter.value } : {}) } }}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                (status ?? "") === (filter.value ?? "")
                  ? "border-accent bg-accent/15 text-accent-foreground"
                  : "border-border text-muted-foreground hover:bg-secondary",
              )}
            >
              {filter.label}
            </Link>
          ))}
        </div>
      </div>

      {cases.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={q || status ? "No cases match your filters" : "No cases yet"}
          description={!q && !status ? "Open your first case to start tracking hearings and deadlines." : undefined}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Advocate</TableHead>
                <TableHead>Filed</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="max-w-xs">
                    <Link href={`/cases/${c.id}`} className="font-medium text-foreground hover:text-accent">
                      {c.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">{c.caseNumber}</p>
                    {c.aiSummary && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground/80">{c.aiSummary}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link href={`/clients/${c.clientId}`} className="text-muted-foreground hover:text-accent">
                      {c.client.fullName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.caseType}</TableCell>
                  <TableCell className="text-muted-foreground">{c.advocate?.fullName ?? "Unassigned"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.filedAt ? formatDate(c.filedAt) : formatDate(c.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        c.status === "WON"
                          ? "success"
                          : c.status === "LOST"
                            ? "destructive"
                            : c.status === "ON_HOLD"
                              ? "warning"
                              : "outline"
                      }
                    >
                      {c.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
