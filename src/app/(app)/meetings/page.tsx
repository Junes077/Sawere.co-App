import { Mic, Video, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listMeetings } from "@/lib/data/meetings";
import { listClients } from "@/lib/data/clients";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { MeetingFormDialog } from "@/components/meetings/meeting-form-dialog";
import { RecordingButton } from "@/components/meetings/recording-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { getDictionary, getUserLocale } from "@/lib/i18n";

export default async function MeetingsPage() {
  const user = await requireUser();
  const dict = getDictionary(getUserLocale(user.preferences));
  const [meetings, clients, cases] = await Promise.all([
    listMeetings(user.firmId),
    listClients(user.firmId),
    prisma.case.findMany({ where: { firmId: user.firmId }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title={dict.pages.meetings.title}
        description={dict.pages.meetings.description}
        actions={<MeetingFormDialog clients={clients} cases={cases} />}
      />

      <Card className="mb-6 border-gold/30 bg-gold/5">
        <CardContent className="flex items-start gap-3 p-4">
          <Mic className="mt-0.5 size-5 text-gold" />
          <div className="text-sm">
            <p className="font-medium text-foreground">
              <Sparkles className="mr-1 inline size-3.5 text-gold" />
              Recording &amp; AI transcription
            </p>
            <p className="text-muted-foreground">
              Hit Record on a meeting below with a clear on-screen indicator so everyone in the
              room knows it&apos;s on. Audio is transcribed and summarized into action items
              automatically once you stop.
            </p>
          </div>
        </CardContent>
      </Card>

      {meetings.length === 0 ? (
        <EmptyState icon={Video} title="No meetings logged yet" />
      ) : (
        <div className="flex flex-col gap-2">
          {meetings.map((m) => (
            <Card key={m.id}>
              <CardContent className="flex flex-col gap-2 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{m.title}</p>
                    <Badge variant="outline">{m.type.replace("_", " ")}</Badge>
                  </div>
                  <RecordingButton meetingId={m.id} firmId={user.firmId} recording={m.recording} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(m.startedAt)}
                  {m.client && ` · ${m.client.fullName}`}
                  {m.case && ` · ${m.case.title}`}
                  {m.host && ` · hosted by ${m.host.fullName}`}
                </p>
                {m.recording?.transcript?.summary && (
                  <p className="rounded-md bg-secondary p-3 text-sm text-foreground/90">
                    {m.recording.transcript.summary}
                  </p>
                )}
                {!!m.recording?.transcript?.actionItems.length && (
                  <ul className="ml-4 list-disc text-sm text-foreground/90">
                    {m.recording.transcript.actionItems.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
