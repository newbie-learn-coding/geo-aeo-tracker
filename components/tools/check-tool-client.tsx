"use client";

import { useState } from "react";
import { Provider, ALL_PROVIDERS, PROVIDER_LABELS } from "@/components/dashboard/types";
import { ProviderBadge } from "@/components/ui/provider-badge";
import type { Dictionary } from "@/lib/i18n/types";

interface CheckResult {
  provider: Provider;
  answer: string;
  sources: string[];
}

interface CheckResponse {
  query: string;
  slug: string;
  results: CheckResult[];
  cached?: boolean;
}

interface CheckToolClientProps {
  dict: Dictionary["check"];
}

export default function CheckToolClient({ dict }: CheckToolClientProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CheckResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setResults([]);
    setExpandedCards(new Set());

    try {
      const res = await fetch("/api/tools/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Request failed (${res.status})`);
      }

      const data: CheckResponse = await res.json();
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (provider: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(provider)) next.delete(provider);
      else next.add(provider);
      return next;
    });
  };

  return (
    <div className="space-y-8">
      {/* Input form */}
      <form onSubmit={handleSubmit} className="bd-card p-6 space-y-4">
        <label className="block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          {dict.label}
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            className="bd-input flex-1 px-4 py-2.5 text-sm"
            placeholder={dict.placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="bd-btn-primary px-6 py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !query.trim()}
          >
            {loading ? dict.submitting : dict.submit}
          </button>
        </div>
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          {dict.rateLimit}
        </p>
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

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_PROVIDERS.map((provider) => (
            <div key={provider} className="bd-card p-5 space-y-3 animate-pulse">
              <div className="flex items-center gap-2">
                <div className="w-20 h-5 rounded" style={{ background: "var(--surface-glass)" }} />
              </div>
              <div className="space-y-2">
                <div className="h-3 rounded w-full" style={{ background: "var(--surface-glass)" }} />
                <div className="h-3 rounded w-5/6" style={{ background: "var(--surface-glass)" }} />
                <div className="h-3 rounded w-4/6" style={{ background: "var(--surface-glass)" }} />
              </div>
              <div className="text-xs pt-1" style={{ color: "var(--text-tertiary)" }}>
                {dict.querying} {PROVIDER_LABELS[provider]}...
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((result) => {
            const expanded = expandedCards.has(result.provider);
            const isLong = result.answer.length > 300;
            const displayText = expanded || !isLong
              ? result.answer
              : result.answer.slice(0, 300) + "...";

            return (
              <div
                key={result.provider}
                className="bd-card p-5 flex flex-col gap-3"
              >
                <ProviderBadge provider={result.provider} />
                <div
                  className="text-sm leading-relaxed whitespace-pre-wrap break-words flex-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {displayText}
                </div>
                {isLong && (
                  <button
                    onClick={() => toggleExpand(result.provider)}
                    className="text-xs font-medium self-start"
                    style={{ color: "var(--accent-primary)" }}
                  >
                    {expanded ? dict.showLess : dict.showMore}
                  </button>
                )}
                {result.sources.length > 0 && (
                  <div className="border-t pt-2 mt-auto" style={{ borderColor: "var(--border-subtle)" }}>
                    <p className="text-[10px] uppercase tracking-wider mb-1.5 font-medium" style={{ color: "var(--text-tertiary)" }}>
                      {dict.sources}
                    </p>
                    <ul className="space-y-1">
                      {result.sources.map((src, i) => (
                        <li key={i}>
                          <a
                            href={src}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs hover:underline truncate block"
                            style={{ color: "var(--accent-primary)" }}
                          >
                            {src}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
