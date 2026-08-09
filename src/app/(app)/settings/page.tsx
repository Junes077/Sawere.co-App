import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileForm } from "@/components/settings/profile-form";
import { FirmForm } from "@/components/settings/firm-form";
import { BrandingForm } from "@/components/settings/branding-form";
import { SecurityPanel } from "@/components/settings/security-panel";
import { PreferencesForm } from "@/components/settings/preferences-form";
import { BackupCard } from "@/components/settings/backup-card";
import { AuditLogTable } from "@/components/settings/audit-log-table";
import { IntegrationsPanel } from "@/components/settings/integrations-panel";
import { UsersPanel } from "@/components/settings/users-panel";
import { getDictionary, getUserLocale } from "@/lib/i18n";

const MANAGER_ROLES = ["OWNER", "ADMIN"];

export default async function SettingsPage() {
  const user = await requireUser();
  const dict = getDictionary(getUserLocale(user.preferences));
  const isManager = MANAGER_ROLES.includes(user.role);

  const [firm, auditLogs, teamUsers, invitations] = await Promise.all([
    prisma.firm.findUniqueOrThrow({ where: { id: user.firmId } }),
    prisma.auditLog.findMany({
      where: { firmId: user.firmId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { user: true },
    }),
    prisma.user.findMany({
      where: { firmId: user.firmId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        title: true,
        isActive: true,
        lastLoginAt: true,
      },
    }),
    isManager
      ? prisma.invitation.findMany({ where: { firmId: user.firmId, status: "PENDING" }, orderBy: { createdAt: "desc" } })
      : Promise.resolve([]),
  ]);

  return (
    <div>
      <PageHeader title={dict.pages.settings.title} description={dict.pages.settings.description} />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">{dict.settingsTabs.profile}</TabsTrigger>
          <TabsTrigger value="firm">{dict.settingsTabs.firm}</TabsTrigger>
          <TabsTrigger value="users">{dict.settingsTabs.users}</TabsTrigger>
          <TabsTrigger value="security">{dict.settingsTabs.security}</TabsTrigger>
          <TabsTrigger value="preferences">{dict.settingsTabs.preferences}</TabsTrigger>
          <TabsTrigger value="integrations">{dict.settingsTabs.integrations}</TabsTrigger>
          <TabsTrigger value="backup">{dict.settingsTabs.backup}</TabsTrigger>
          <TabsTrigger value="audit">{dict.settingsTabs.audit}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4 max-w-2xl">
          <ProfileForm user={user} />
        </TabsContent>
        <TabsContent value="firm" className="mt-4 flex max-w-2xl flex-col gap-4">
          <FirmForm firm={firm} editable={["OWNER", "ADMIN"].includes(user.role)} />
          {["OWNER", "ADMIN"].includes(user.role) && <BrandingForm firm={firm} />}
        </TabsContent>
        <TabsContent value="users" className="mt-4">
          <UsersPanel
            currentUserId={user.id}
            users={teamUsers}
            invitations={invitations}
            isManager={isManager}
          />
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
