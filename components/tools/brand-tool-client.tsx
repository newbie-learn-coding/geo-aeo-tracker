"use client";

import { useState } from "react";
import { Provider } from "@/components/dashboard/types";
import { ScoreRing } from "@/components/ui/score-ring";
import { ProviderBadge } from "@/components/ui/provider-badge";
import type { Dictionary } from "@/lib/i18n/types";

interface ProviderResult {
  provider: Provider;
  visibilityScore: number;
  sentiment: "positive" | "neutral" | "negative" | "not-mentioned";
  brandMentions: string[];
  competitorMentions: string[];
}

interface BrandResponse {
  brandName: string;
  results: ProviderResult[];
}

interface BrandToolClientProps {
  dict: Dictionary["brand"];
}

export default function BrandToolClient({ dict }: BrandToolClientProps) {
  const [brandName, setBrandName] = useState("");
  const [website, setWebsite] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [result, setResult] = useState<BrandResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sentimentConfig: Record<string, { label: string; color: string; bg: string }> = {
    positive: { label: dict.positive, color: "var(--accent-success)", bg: "var(--accent-success-muted)" },
    neutral: { label: dict.neutral, color: "var(--accent-warning)", bg: "var(--accent-warning-muted)" },
    negative: { label: dict.negative, color: "var(--accent-error)", bg: "var(--accent-error-muted)" },
    "not-mentioned": { label: dict.notMentioned, color: "var(--text-tertiary)", bg: "var(--surface-glass)" },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedBrand = brandName.trim();
    if (!trimmedBrand) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const body: Record<string, string> = { brandName: trimmedBrand };
      if (website.trim()) body.website = website.trim();
      if (competitors.trim()) body.competitors = competitors.trim();

      const res = await fetch("/api/tools/brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Request failed (${res.status})`);
      }

      const data: BrandResponse = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const overallScore = result
    ? Math.round(result.results.reduce((sum, r) => sum + r.visibilityScore, 0) / result.results.length)
    : 0;

  return (
    <div className="space-y-8">
      {/* Input form */}
      <form onSubmit={handleSubmit} className="bd-card p-6 space-y-4">
        <label className="block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          {dict.label}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <input
              type="text"
              className="bd-input w-full px-4 py-2.5 text-sm"
              placeholder={dict.brandPlaceholder}
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <input
            type="url"
            className="bd-input w-full px-4 py-2.5 text-sm"
            placeholder={dict.websitePlaceholder}
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            disabled={loading}
          />
          <input
            type="text"
            className="bd-input w-full px-4 py-2.5 text-sm"
            placeholder={dict.competitorsPlaceholder}
            value={competitors}
            onChange={(e) => setCompetitors(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            {dict.rateLimit}
          </p>
          <button
            type="submit"
            className="bd-btn-primary px-6 py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !brandName.trim()}
          >
            {loading ? dict.submitting : dict.submit}
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{ background: "var(--accent-error-muted)", color: "var(--accent-error)", border: "1px solid var(--accent-error)" }}
        >
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bd-card p-8 flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div
              className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "var(--border-default)", borderTopColor: "var(--accent-primary)" }}
            />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              {dict.loading}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
              {dict.loadingDetail}
            </p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Overall score */}
          <div className="bd-card p-6 flex flex-col sm:flex-row items-center gap-6">
            <ScoreRing score={overallScore} size={100} strokeWidth={8} label={dict.scoreLabel} />
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                {result.brandName}
              </h3>
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                {dict.avgVisibility.replace("{count}", String(result.results.length))}
              </p>
              <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                {(() => {
                  const sentiments = result.results.reduce(
                    (acc, r) => { acc[r.sentiment] = (acc[r.sentiment] || 0) + 1; return acc; },
                    {} as Record<string, number>
                  );
                  return Object.entries(sentiments).map(([sentiment, count]) => {
                    const config = sentimentConfig[sentiment];
                    return (
                      <span
                        key={sentiment}
                        className="bd-chip px-2 py-0.5 text-xs"
                        style={{ color: config.color, background: config.bg }}
                      >
                        {config.label}: {count}
                      </span>
                    );
                  });
                })()}
              </div>
            </div>
          </div>

          {/* Per-provider cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {result.results.map((provResult) => {
              const sc = sentimentConfig[provResult.sentiment];
              return (
                <div key={provResult.provider} className="bd-card p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <ProviderBadge provider={provResult.provider} />
                    <ScoreRing score={provResult.visibilityScore} size={48} strokeWidth={4} />
                  </div>

                  {/* Sentiment */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{dict.sentiment}</span>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded"
                      style={{ color: sc.color, background: sc.bg }}
                    >
                      {sc.label}
                    </span>
                  </div>

                  {/* Mentions */}
                  {provResult.brandMentions.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider mb-1 font-medium" style={{ color: "var(--text-tertiary)" }}>
                        {dict.brandMentions}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {provResult.brandMentions.map((m, i) => (
                          <span
                            key={i}
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{ background: "var(--th-brand-bg)", color: "var(--th-brand-text)" }}
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {provResult.competitorMentions.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider mb-1 font-medium" style={{ color: "var(--text-tertiary)" }}>
                        {dict.competitorMentions}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {provResult.competitorMentions.map((m, i) => (
                          <span
                            key={i}
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{ background: "var(--th-competitor-bg)", color: "var(--th-competitor-text)" }}
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
