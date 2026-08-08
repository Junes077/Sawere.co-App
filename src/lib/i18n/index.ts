import { en, type Dictionary } from "@/lib/i18n/en";
import { sw } from "@/lib/i18n/sw";

export type Locale = "en" | "sw";
export type { Dictionary };

const dictionaries: Record<Locale, Dictionary> = { en, sw };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? en;
}

/** Reads the saved language preference off a User row's `preferences` JSON
 * field (set in Settings > Preferences), defaulting to English. */
export function getUserLocale(preferences: unknown): Locale {
  if (preferences && typeof preferences === "object" && "language" in preferences) {
    const lang = (preferences as { language?: unknown }).language;
    if (lang === "sw") return "sw";
  }
  return "en";
}
