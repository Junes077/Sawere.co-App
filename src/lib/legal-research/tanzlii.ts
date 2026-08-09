import * as cheerio from "cheerio";
import type { SourceTypeValue } from "@/lib/legal-research/constants";
import { getSource } from "@/lib/legal-research/sources";

export type RetrievedResult = {
  title: string;
  url: string;
};

export type RetrievalOutcome =
  | { retrieved: true; results: RetrievedResult[]; searchUrl: string; institution: string }
  | { retrieved: false; searchUrl: string; institution: string; reason: string };

/**
 * Best-effort inline retrieval: fetches the source's real search page and
 * conservatively pulls out document titles + links. Deliberately does NOT
 * invent court/citation/date fields we can't reliably parse — only what's
 * directly present as link text. Any failure (network, non-200, no
 * confidently-matched document links) returns retrieved:false with the real
 * search URL still included, so the caller can always fall back to sending
 * the advocate to the live source instead of showing nothing or something
 * wrong. Akoma Ntoso URIs (/akn/{country}/...) are the standard, stable
 * document-identifier format across the whole Laws.Africa/Indigo network
 * TanzLII runs on, so we key off those first before falling back to the
 * section path (/judgments/, /legislation/, /gazettes/).
 */
export async function searchTanzlii(
  sourceType: SourceTypeValue,
  query: string,
): Promise<RetrievalOutcome> {
  const source = getSource("TZ", sourceType);
  if (!source) {
    return { retrieved: false, searchUrl: "", institution: "", reason: "No source configured" };
  }

  const searchUrl = source.searchUrl(query);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(searchUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "SawereLegalOS/1.0 (+legal research tool)" },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return { retrieved: false, searchUrl, institution: source.institution, reason: `Source returned ${res.status}` };
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const seen = new Set<string>();
    const results: RetrievedResult[] = [];

    $("a[href]").each((_, el) => {
      if (results.length >= 10) return;
      const href = $(el).attr("href") ?? "";
      const looksLikeDocument =
        href.includes("/akn/tz/") ||
        /\/(judgments|legislation|gazettes)\/[a-z0-9-]+\/.+/i.test(href);
      if (!looksLikeDocument) return;

      const title = $(el).text().trim().replace(/\s+/g, " ");
      if (!title || title.length < 4) return;

      const url = href.startsWith("http") ? href : new URL(href, "https://tanzlii.org").toString();
      if (seen.has(url)) return;
      seen.add(url);
      results.push({ title, url });
    });

    if (results.length === 0) {
      return {
        retrieved: false,
        searchUrl,
        institution: source.institution,
        reason: "Couldn't confidently identify document results on the page",
      };
    }

    return { retrieved: true, results, searchUrl, institution: source.institution };
  } catch (err) {
    return {
      retrieved: false,
      searchUrl,
      institution: source.institution,
      reason: err instanceof Error ? err.message : "Couldn't reach the source",
    };
  }
}
