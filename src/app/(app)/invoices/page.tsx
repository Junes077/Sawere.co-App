import Link from "next/link";
import { Receipt, Wallet } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listInvoices, listExpenses } from "@/lib/data/invoices";
import { listClients } from "@/lib/data/clients";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { InvoiceFormDialog } from "@/components/invoices/invoice-form-dialog";
import { ExpenseFormDialog } from "@/components/invoices/expense-form-dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";

const STATUS_VARIANT: Record<string, "success" | "outline" | "destructive" | "warning"> = {
  PAID: "success",
  PARTIALLY_PAID: "warning",
  OVERDUE: "destructive",
  VOID: "outline",
};

export default async function InvoicesPage() {
  const user = await requireUser();
  const [invoices, expenses, clients] = await Promise.all([
    listInvoices(user.firmId),
    listExpenses(user.firmId),
    listClients(user.firmId),
  ]);

  return (
    <div>
      <PageHeader title="Billing" description="Invoices, payments and firm expenses." />

      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="mt-4">
          <div className="mb-4 flex justify-end">
            <InvoiceFormDialog clients={clients} />
          </div>
          {invoices.length === 0 ? (
            <EmptyState icon={Receipt} title="No invoices yet" description="Create your first invoice to start billing clients." />
          ) : (
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>
                        <Link href={`/invoices/${inv.id}`} className="font-medium text-foreground hover:text-accent">
                          {inv.invoiceNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{inv.client.fullName}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(inv.issueDate)}</TableCell>
                      <TableCell className="text-muted-foreground">{inv.dueDate ? formatDate(inv.dueDate) : "—"}</TableCell>
                      <TableCell className="font-medium text-foreground">
                        {formatCurrency(Number(inv.total), inv.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[inv.status] ?? "outline"}>{inv.status.replace("_", " ")}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="expenses" className="mt-4">
          <div className="mb-4 flex justify-end">
            <ExpenseFormDialog />
          </div>
          {expenses.length === 0 ? (
            <EmptyState icon={Wallet} title="No expenses recorded" />
          ) : (
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((exp) => (
                    <TableRow key={exp.id}>
                      <TableCell className="text-muted-foreground">{formatDate(exp.incurredAt)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{exp.category}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{exp.description}</TableCell>
                      <TableCell className="font-medium text-foreground">{formatCurrency(Number(exp.amount))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
