import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const signupSchema = z.object({
  firmName: z.string().min(2).max(120),
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8),
});

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { firmName, fullName, email, password } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (!data.user) {
    return NextResponse.json({ error: "Signup failed. Please try again." }, { status: 500 });
  }

  const baseSlug = slugify(firmName) || "firm";
  let slug = baseSlug;
  let attempt = 0;
  while (await prisma.firm.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${baseSlug}-${attempt + 1}`;
  }

  try {
    await prisma.$transaction([
      prisma.firm.create({
        data: {
          name: firmName,
          slug,
          users: {
            create: {
              id: data.user.id,
              email,
              fullName,
              role: "OWNER",
            },
          },
        },
      }),
    ]);
  } catch (err) {
    console.error("Failed to provision firm/user profile after signup", err);
    return NextResponse.json(
      { error: "Account created but firm setup failed. Contact support." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    needsEmailConfirmation: !data.session,
  });
}
