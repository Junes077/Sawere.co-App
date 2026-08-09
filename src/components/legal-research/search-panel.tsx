"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Search, ExternalLink, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SaveResultDialog } from "@/components/legal-research/save-result-dialog";
import { COUNTRIES, PRACTICE_AREAS, SOURCE_TYPES } from "@/lib/legal-research/constants";
import type { Client, Case } from "@prisma/client";

type RetrievalOutcome =
  | { retrieved: true; results: { title: string; url: string }[]; searchUrl: string; institution: string }
  | { retrieved: false; searchUrl: string; institution: string; reason: string };

type Explanation = { loading: boolean; text?: string; error?: string };

export function SearchPanel({ clients, cases }: { clients: Client[]; cases: Case[] }) {
  const [country, setCountry] = useState("TZ");
  const [sourceType, setSourceType] = useState<string>(SOURCE_TYPES[0].value);
  const [practiceArea, setPracticeArea] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [outcome, setOutcome] = useState<RetrievalOutcome | null>(null);
  const [explanations, setExplanations] = useState<Record<string, Explanation>>({});

  const selectedCountry = COUNTRIES.find((c) => c.code === country);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setOutcome(null);
    setExplanations({});

    try {
      const res = await fetch("/api/legal-research/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, sourceType, practiceArea, query }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json) {
        toast.error("Search failed unexpectedly");
        return;
      }
      setOutcome(json);
    } catch {
      toast.error("Couldn't reach the search service");
    } finally {
      setLoading(false);
    }
  }

  async function explain(url: string, title: string) {
    setExplanations((prev) => ({ ...prev, [url]: { loading: true } }));
    try {
      const res = await fetch("/api/legal-research/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, url, query }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setExplanations((prev) => ({ ...prev, [url]: { loading: false, error: json.error ?? "Failed" } }));
        return;
      }
      setExplanations((prev) => ({ ...prev, [url]: { loading: false, text: json.explanation } }));
    } catch {
      setExplanations((prev) => ({ ...prev, [url]: { loading: false, error: "Couldn't reach the AI" } }));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Search authoritative sources</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label>Jurisdiction</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.code} value={c.code} disabled={!c.supported}>
                        {c.name}
                        {!c.supported ? " (not yet configured)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Practice area</Label>
                <Select value={practiceArea || "any"} onValueChange={(v) => setPracticeArea(v === "any" ? "" : v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    {PRACTICE_AREAS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Source type</Label>
                <Select value={sourceType} onValueChange={setSourceType}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCE_TYPES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="query">Search query</Label>
              <div className="flex gap-2">
                <Input
                  id="query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. unlawful transfer of village land"
                  disabled={!selectedCountry?.supported}
                />
                <Button type="submit" disabled={loading || !query.trim() || !selectedCountry?.supported}>
                  {loading ? <Loader2 className="animate-spin" /> : <Search />}
                  Search
                </Button>
              </div>
              {!selectedCountry?.supported && (
                <p className="text-xs text-muted-foreground">
                  No verified sources are configured for {selectedCountry?.name} yet — Tanzania is the only
                  supported jurisdiction today.
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Searching {selectedCountry?.name}…
          </CardContent>
        </Card>
      )}

      {!loading && outcome && (
        <>
          {outcome.retrieved ? (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-muted-foreground">
                {outcome.results.length} result{outcome.results.length === 1 ? "" : "s"} from {outcome.institution}
              </p>
              {outcome.results.map((r) => {
                const ex = explanations[r.url];
                return (
                  <Card key={r.url}>
                    <CardContent className="flex flex-col gap-2 p-4">
                      <p className="font-medium text-foreground">{r.title}</p>
                      {ex?.text && (
                        <div className="flex items-start gap-2 rounded-md bg-gold/5 p-2 text-sm text-muted-foreground">
                          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-gold" />
                          <p>
                            <span className="font-medium text-foreground">AI note (not verified): </span>
                            {ex.text}
                          </p>
                        </div>
                      )}
                      {ex?.error && (
                        <p className="text-xs text-destructive">{ex.error}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-accent hover:underline"
                        >
                          Open source <ExternalLink className="size-3.5" />
                        </a>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={ex?.loading}
                          onClick={() => explain(r.url, r.title)}
                        >
                          {ex?.loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                          Explain relevance
                        </Button>
                        <SaveResultDialog
                          title={r.title}
                          sourceUrl={r.url}
                          jurisdiction={selectedCountry?.name ?? ""}
                          practiceArea={practiceArea}
                          sourceType={sourceType}
                          clients={clients}
                          cases={cases}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-warning/30 bg-warning/5">
              <CardContent className="flex items-start gap-3 p-4 text-sm">
                <AlertCircle className="mt-0.5 size-5 shrink-0 text-warning" />
                <div className="flex flex-col gap-2">
                  <p className="text-foreground">{outcome.reason}</p>
                  {outcome.searchUrl && (
                    <a href={outcome.searchUrl} target="_blank" rel="noopener noreferrer">
                      <Button type="button" variant="outline" size="sm">
                        Search directly on {outcome.institution || "the source"} <ExternalLink />
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
