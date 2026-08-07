import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileForm } from "@/components/settings/profile-form";
import { FirmForm } from "@/components/settings/firm-form";
import { SecurityPanel } from "@/components/settings/security-panel";
import { PreferencesForm } from "@/components/settings/preferences-form";
import { BackupCard } from "@/components/settings/backup-card";
import { AuditLogTable } from "@/components/settings/audit-log-table";
import { IntegrationsPanel } from "@/components/settings/integrations-panel";

export default async function SettingsPage() {
  const user = await requireUser();

  const [firm, auditLogs] = await Promise.all([
    prisma.firm.findUniqueOrThrow({ where: { id: user.firmId } }),
    prisma.auditLog.findMany({
      where: { firmId: user.firmId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { user: true },
    }),
  ]);

  return (
    <div>
      <PageHeader title="Settings" description="Your profile, firm, security and preferences." />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="firm">Firm</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="audit">Audit log</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4 max-w-2xl">
          <ProfileForm user={user} />
        </TabsContent>
        <TabsContent value="firm" className="mt-4 max-w-2xl">
          <FirmForm firm={firm} editable={["OWNER", "ADMIN"].includes(user.role)} />
        </TabsContent>
        <TabsContent value="security" className="mt-4 max-w-2xl">
          <SecurityPanel user={user} />
        </TabsContent>
        <TabsContent value="preferences" className="mt-4 max-w-2xl">
          <PreferencesForm user={user} />
        </TabsContent>
        <TabsContent value="integrations" className="mt-4 max-w-2xl">
          <IntegrationsPanel />
        </TabsContent>
        <TabsContent value="backup" className="mt-4 max-w-2xl">
          <BackupCard />
        </TabsContent>
        <TabsContent value="audit" className="mt-4">
          <AuditLogTable logs={auditLogs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
