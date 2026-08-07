import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getInvoiceDetail } from "@/lib/data/invoices";
import { PageHeader } from "@/components/shared/page-header";
import { RecordPaymentDialog } from "@/components/invoices/record-payment-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";

const STATUS_VARIANT: Record<string, "success" | "outline" | "destructive" | "warning"> = {
  PAID: "success",
  PARTIALLY_PAID: "warning",
  OVERDUE: "destructive",
  VOID: "outline",
};

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const invoice = await getInvoiceDetail(user.firmId, id);

  if (!invoice) notFound();

  const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const balance = Number(invoice.total) - totalPaid;

  return (
    <div>
      <PageHeader
        title={invoice.invoiceNumber}
        description={`Billed to ${invoice.client.fullName}`}
        actions={
          <>
            <Badge variant={STATUS_VARIANT[invoice.status] ?? "outline"} className="mr-2">
              {invoice.status.replace("_", " ")}
            </Badge>
            {balance > 0 && <RecordPaymentDialog invoiceId={invoice.id} />}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Line items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Unit price</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{Number(item.quantity)}</TableCell>
                      <TableCell>{formatCurrency(Number(item.unitPrice), invoice.currency)}</TableCell>
                      <TableCell className="font-medium text-foreground">
                        {formatCurrency(Number(item.amount), invoice.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex flex-col items-end gap-1 border-t border-border p-4 text-sm">
                <p className="text-muted-foreground">
                  Subtotal: {formatCurrency(Number(invoice.subtotal), invoice.currency)}
                </p>
                <p className="text-muted-foreground">
                  Tax: {formatCurrency(Number(invoice.taxAmount), invoice.currency)}
                </p>
                <p className="font-serif text-lg text-foreground">
                  Total: {formatCurrency(Number(invoice.total), invoice.currency)}
                </p>
              </div>
            </CardContent>
          </Card>

          {invoice.notes && (
            <Card className="mt-4">
              <CardContent className="p-4 text-sm text-foreground/90">{invoice.notes}</CardContent>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardContent className="flex flex-col gap-2 p-6 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Issued</span>
                <span className="text-foreground">{formatDate(invoice.issueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due</span>
                <span className="text-foreground">{invoice.dueDate ? formatDate(invoice.dueDate) : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paid</span>
                <span className="text-success">{formatCurrency(totalPaid, invoice.currency)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-muted-foreground">Balance</span>
                <span className="text-foreground">{formatCurrency(balance, invoice.currency)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payments</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {invoice.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
              ) : (
                invoice.payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                    <div>
                      <p className="font-medium text-foreground">{formatCurrency(Number(p.amount), invoice.currency)}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.method.replace("_", " ")} · {formatDate(p.paidAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
