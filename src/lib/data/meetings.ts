import { prisma } from "@/lib/prisma";

export const RECORDINGS_BUCKET = "recordings";

export async function listMeetings(firmId: string) {
  return prisma.meeting.findMany({
    where: { firmId },
    orderBy: { startedAt: "desc" },
    include: { client: true, case: true, host: true, recording: { include: { transcript: true } } },
  });
}
