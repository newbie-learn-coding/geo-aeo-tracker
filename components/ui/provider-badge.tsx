"use client";

import { Provider, PROVIDER_LABELS } from "@/components/dashboard/types";

const PROVIDER_COLORS: Record<Provider, string> = {
  chatgpt: "#10a37f",
  perplexity: "#20808d",
  gemini: "#8e44ef",
  copilot: "#0078d4",
  google_ai: "#4285f4",
  grok: "#1d9bf0",
};

interface ProviderBadgeProps {
  provider: Provider;
  className?: string;
}

export function ProviderBadge({ provider, className = "" }: ProviderBadgeProps) {
  const color = PROVIDER_COLORS[provider];
  const label = PROVIDER_LABELS[provider];

  return (
    <span
      className={`bd-chip inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium ${className}`}
      style={{ borderLeftColor: color, borderLeftWidth: 3 }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: color }}
      />
      <span style={{ color }}>{label}</span>
    </span>
  );
}
