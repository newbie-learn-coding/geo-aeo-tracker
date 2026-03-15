import { useState } from "react";
import type { Battlecard } from "@/components/dashboard/types";

type BattlecardsTabProps = {
  competitors: string;
  battlecards: Battlecard[];
  onCompetitorsChange: (value: string) => void;
  onBuildBattlecards: () => void;
};

function SentimentBadge({ sentiment }: { sentiment: string }) {
  const styles: Record<string, string> = {
    positive: "bg-th-success-soft text-th-success",
    neutral: "bg-th-accent-soft text-th-text-accent",
    negative: "bg-th-danger-soft text-th-danger",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[sentiment] ?? styles.neutral}`}>
      {sentiment}
    </span>
  );
}

export function BattlecardsTab({
  competitors,
  battlecards,
  onCompetitorsChange,
  onBuildBattlecards,
}: BattlecardsTabProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium uppercase tracking-wider text-th-text-muted">
        Competitors (comma-separated)
      </label>
      <input
        value={competitors}
        onChange={(e) => onCompetitorsChange(e.target.value)}
        className="bd-input w-full rounded-lg p-2.5 text-sm"
      />
      <button
        onClick={onBuildBattlecards}
        className="bd-btn-primary rounded-lg px-4 py-2.5 text-sm"
      >
        Build Battlecards
      </button>

      {battlecards.length === 0 && (
        <div className="rounded-lg border border-th-border bg-th-card-alt p-8 text-center text-sm text-th-text-muted">
          No battlecards yet. Add competitors and click Build Battlecards.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {battlecards.map((card) => {
          const isExpanded = expandedCard === card.competitor;
          return (
            <div
              key={card.competitor}
              className="rounded-xl border border-th-border bg-th-card shadow-sm overflow-hidden"
            >
              {/* Card header */}
              <button
                onClick={() => setExpandedCard(isExpanded ? null : card.competitor)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-th-card-hover transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-th-accent-soft">
                  <span className="text-sm font-bold text-th-text-accent">
                    {card.competitor.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-semibold text-th-text truncate">{card.competitor}</div>
                </div>
                <SentimentBadge sentiment={card.sentiment} />
                <span className="text-xs text-th-text-muted">{isExpanded ? "▲" : "▼"}</span>
              </button>

              {/* Summary - always visible */}
              <div className="border-t border-th-border px-4 py-3">
                <p className="text-sm leading-relaxed text-th-text-secondary">{card.summary}</p>
              </div>

              {/* Structured sections - expandable */}
              {isExpanded && card.sections && card.sections.length > 0 && (
                <div className="border-t border-th-border px-4 py-3 space-y-3">
                  {card.sections.map((section) => (
                    <div key={section.heading}>
                      <h4 className="text-sm font-semibold text-th-text mb-1.5">{section.heading}</h4>
                      <ul className="space-y-1">
                        {section.points.map((point, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-th-text-secondary">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-th-accent shrink-0" />
                            <span className="leading-relaxed">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* Expand hint when sections exist but collapsed */}
              {!isExpanded && card.sections && card.sections.length > 0 && (
                <div className="border-t border-th-border-subtle px-4 py-2">
                  <span className="text-xs text-th-text-muted">
                    {card.sections.length} detailed section{card.sections.length > 1 ? "s" : ""} — click to expand
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
