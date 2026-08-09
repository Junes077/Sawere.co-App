import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth";
import { searchTanzlii } from "@/lib/legal-research/tanzlii";
import { COUNTRIES, SOURCE_TYPES, type SourceTypeValue } from "@/lib/legal-research/constants";

export const runtime = "nodejs";
export const maxDuration = 30;

const SOURCE_TYPE_VALUES = SOURCE_TYPES.map((s) => s.value) as [SourceTypeValue, ...SourceTypeValue[]];

const searchSchema = z.object({
  country: z.string().length(2),
  sourceType: z.enum(SOURCE_TYPE_VALUES),
  practiceArea: z.string().max(60).optional().or(z.literal("")),
  query: z.string().min(2, "Enter at least 2 characters").max(300),
});

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;

  const parsed = searchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { country, sourceType, practiceArea, query } = parsed.data;

  const countryConfig = COUNTRIES.find((c) => c.code === country);
  if (!countryConfig?.supported) {
    return NextResponse.json({
      retrieved: false,
      searchUrl: "",
      institution: "",
      reason: `No verified legal sources are configured for ${countryConfig?.name ?? country} yet.`,
    });
  }

  try {
    const effectiveQuery = practiceArea ? `${query} ${practiceArea}` : query;
    const outcome = await searchTanzlii(sourceType, effectiveQuery);
    return NextResponse.json(outcome);
  } catch (err) {
    console.error("Legal research search failed", err);
    return NextResponse.json({
      retrieved: false,
      searchUrl: "",
      institution: "",
      reason: err instanceof Error ? err.message : "Search failed unexpectedly.",
    });
  }
}
