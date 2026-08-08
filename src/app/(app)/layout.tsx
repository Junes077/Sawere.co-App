import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { getDictionary, getUserLocale } from "@/lib/i18n";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const firm = await prisma.firm.findUnique({
    where: { id: user.firmId },
    select: { name: true, logoUrl: true },
  });
  const dict = getDictionary(getUserLocale(user.preferences));

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar firmName={firm?.name ?? "Sawere & Co."} logoUrl={firm?.logoUrl ?? null} dict={dict} />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar user={user} firmName={firm?.name ?? "Sawere & Co."} logoUrl={firm?.logoUrl ?? null} dict={dict} />
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
