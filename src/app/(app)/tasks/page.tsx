import { requireUser } from "@/lib/auth";
import { listTasks } from "@/lib/data/tasks";
import { listClients } from "@/lib/data/clients";
import { listFirmAdvocates } from "@/lib/data/cases";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { TaskBoard } from "@/components/tasks/task-board";
import { getDictionary, getUserLocale } from "@/lib/i18n";

export default async function TasksPage() {
  const user = await requireUser();
  const dict = getDictionary(getUserLocale(user.preferences));

  const [tasks, clients, cases, advocates] = await Promise.all([
    listTasks(user.firmId),
    listClients(user.firmId),
    prisma.case.findMany({ where: { firmId: user.firmId }, orderBy: { createdAt: "desc" } }),
    listFirmAdvocates(user.firmId),
  ]);

  return (
    <div>
      <PageHeader
        title={dict.pages.tasks.title}
        description={dict.pages.tasks.description}
        actions={<TaskFormDialog clients={clients} cases={cases} advocates={advocates} />}
      />
      <TaskBoard tasks={tasks} />
    </div>
  );
}
