import { NextResponse } from "next/server";
import { findPendingInviteByToken } from "@/lib/invites";

/** Public (no auth) — lets the signup page show who/what an invite link is for before the person creates an account. */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const invite = await findPendingInviteByToken(token);
  if (!invite) {
    return NextResponse.json({ error: "This invite link has expired or was already used." }, { status: 404 });
  }

  return NextResponse.json({
    firmName: invite.firm.name,
    email: invite.email,
    role: invite.role,
  });
}
