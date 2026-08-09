export const PRACTICE_AREAS = [
  "Land",
  "Commercial",
  "Corporate",
  "Civil",
  "Criminal",
  "Employment",
  "Family",
  "Tax",
  "Constitutional",
  "Human Rights",
  "Intellectual Property",
  "Arbitration",
] as const;

export const SOURCE_TYPES = [
  { value: "CASE_LAW", label: "Cases / Judgments" },
  { value: "LEGISLATION", label: "Legislation" },
  { value: "GAZETTE", label: "Government Gazettes" },
] as const;

export type SourceTypeValue = (typeof SOURCE_TYPES)[number]["value"];

/**
 * Country list for the jurisdiction picker. `supported` gates whether a
 * country can actually be searched — per the master spec, a jurisdiction
 * only shows as supported once a real, configured source exists for it (see
 * src/lib/legal-research/sources.ts). Everything else is listed but
 * disabled with an honest "not yet configured" reason, instead of either
 * hiding the ambition or pretending to search a jurisdiction we can't.
 */
export const COUNTRIES = [
  { code: "TZ", name: "Tanzania", supported: true },
  { code: "KE", name: "Kenya", supported: false },
  { code: "UG", name: "Uganda", supported: false },
  { code: "RW", name: "Rwanda", supported: false },
  { code: "ZA", name: "South Africa", supported: false },
  { code: "GB", name: "United Kingdom", supported: false },
] as const;
