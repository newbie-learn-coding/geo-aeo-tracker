"use client";

import { useState } from "react";
import { ScoreRing } from "@/components/ui/score-ring";
import type { Dictionary } from "@/lib/i18n/types";

type AuditCategory = "discovery" | "structure" | "content" | "technical" | "rendering";

interface AuditCheck {
  id: string;
  label: string;
  category: AuditCategory;
  pass: boolean;
  value: string;
  detail: string;
}

interface AuditResult {
  url: string;
  score: number;
  checks: AuditCheck[];
}

const CATEGORY_ORDER: AuditCategory[] = ["discovery", "structure", "content", "technical", "rendering"];

interface AuditToolClientProps {
  dict: Dictionary["audit"];
}

export default function AuditToolClient({ dict }: AuditToolClientProps) {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedChecks, setExpandedChecks] = useState<Set<string>>(new Set());

  const categoryLabels: Record<AuditCategory, string> = {
    discovery: dict.discovery,
    structure: dict.structure,
    content: dict.content,
    technical: dict.technical,
    rendering: dict.rendering,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setExpandedChecks(new Set());

    try {
      const res = await fetch("/api/tools/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Request failed (${res.status})`);
      }

      const data: AuditResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleCheck = (id: string) => {
    setExpandedChecks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const groupedChecks = result
    ? CATEGORY_ORDER.map((cat) => ({
        category: cat,
        label: categoryLabels[cat],
        checks: result.checks.filter((c) => c.category === cat),
      })).filter((g) => g.checks.length > 0)
    : [];

  return (
    <div className="space-y-8">
      {/* Input form */}
      <form onSubmit={handleSubmit} className="bd-card p-6 space-y-4">
        <label className="block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          {dict.label}
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            className="bd-input flex-1 px-4 py-2.5 text-sm"
            placeholder={dict.placeholder}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="bd-btn-primary px-6 py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !url.trim()}
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
          {/* Score overview */}
          <div className="bd-card p-6 flex flex-col sm:flex-row items-center gap-6">
            <ScoreRing score={result.score} size={100} strokeWidth={8} label={dict.scoreLabel} />
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                {result.url}
              </h3>
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                {result.checks.filter((c) => c.pass).length} / {result.checks.length} {dict.checksPassed}
              </p>
              <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                {CATEGORY_ORDER.map((cat) => {
                  const catChecks = result.checks.filter((c) => c.category === cat);
                  if (catChecks.length === 0) return null;
                  const passed = catChecks.filter((c) => c.pass).length;
                  return (
                    <span
                      key={cat}
                      className="bd-chip px-2 py-0.5 text-xs"
                    >
                      {categoryLabels[cat]}: {passed}/{catChecks.length}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Grouped checks */}
          {groupedChecks.map((group) => (
            <div key={group.category} className="space-y-2">
              <h4
                className="text-xs uppercase tracking-wider font-semibold px-1"
                style={{ color: "var(--text-tertiary)" }}
              >
                {group.label}
              </h4>
              <div className="space-y-1.5">
                {group.checks.map((check) => {
                  const expanded = expandedChecks.has(check.id);
                  return (
                    <div key={check.id} className="bd-card">
                      <button
                        onClick={() => toggleCheck(check.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left"
                      >
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                          style={{
                            background: check.pass ? "var(--accent-success-muted)" : "var(--accent-error-muted)",
                            color: check.pass ? "var(--accent-success)" : "var(--accent-error)",
                          }}
                        >
                          {check.pass ? "\u2713" : "\u2717"}
                        </span>
                        <span className="flex-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                          {check.label}
                        </span>
                        <span className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
                          {check.value}
                        </span>
                        <svg
                          className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                          style={{ color: "var(--text-tertiary)" }}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {expanded && check.detail && (
                        <div
                          className="px-4 pb-3 text-xs leading-relaxed border-t"
                          style={{ color: "var(--text-secondary)", borderColor: "var(--border-subtle)" }}
                        >
                          <p className="pt-2">{check.detail}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
