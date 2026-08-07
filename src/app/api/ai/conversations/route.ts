import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listConversations } from "@/lib/data/ai";

export async function GET() {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;

  const conversations = await listConversations(auth.user.firmId, auth.user.id);
  return NextResponse.json({ conversations });
}

export async function POST() {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const conversation = await prisma.aiConversation.create({
    data: { firmId: user.firmId, userId: user.id },
  });

  return NextResponse.json({ conversation }, { status: 201 });
}
