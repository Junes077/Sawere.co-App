import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { OnboardingForm } from "@/components/auth/onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) redirect("/login");

  const existing = await prisma.user.findUnique({ where: { id: authUser.id } });
  if (existing) redirect("/dashboard");

  return (
    <OnboardingForm
      defaultFullName={(authUser.user_metadata?.full_name as string) ?? ""}
      email={authUser.email ?? ""}
    />
  );
}
