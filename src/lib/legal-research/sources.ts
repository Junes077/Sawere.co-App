import type { SourceTypeValue } from "@/lib/legal-research/constants";

export type LegalSource = {
  institution: string;
  /** Human-visited search page for this source type — always correct, even
   * if inline parsing below fails or the site's markup changes. */
  searchUrl: (query: string) => string;
};

/**
 * Configurable source registry (see master spec §15). Only Tanzania is wired
 * up today, against TanzLII (tanzlii.org) — the Tanzanian Judiciary's own
 * free-access legal database, part of the AfricanLII/Laws.Africa network.
 * Adding a country means adding a real, verified entry here — never a
 * placeholder that pretends to search a jurisdiction we haven't configured.
 */
const REGISTRY: Record<string, Partial<Record<SourceTypeValue, LegalSource>>> = {
  TZ: {
    CASE_LAW: {
      institution: "TanzLII — Tanzania Legal Information Institute (Judgments)",
      searchUrl: (query) => `https://tanzlii.org/judgments/?q=${encodeURIComponent(query)}`,
    },
    LEGISLATION: {
      institution: "TanzLII — Tanzania Legal Information Institute (Legislation)",
      searchUrl: (query) => `https://tanzlii.org/legislation/?q=${encodeURIComponent(query)}`,
    },
    GAZETTE: {
      institution: "TanzLII — Tanzania Legal Information Institute (Gazettes)",
      searchUrl: (query) => `https://tanzlii.org/gazettes/?q=${encodeURIComponent(query)}`,
    },
  },
};

export function getSource(countryCode: string, sourceType: SourceTypeValue): LegalSource | null {
  return REGISTRY[countryCode]?.[sourceType] ?? null;
}
