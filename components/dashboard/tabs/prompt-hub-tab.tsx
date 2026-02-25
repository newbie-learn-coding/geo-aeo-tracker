import { useState } from "react";

type PromptHubTabProps = {
  customPrompts: string[];
  brandName?: string;
  busy: boolean;
  activeProviderCount: number;
  onAddCustomPrompt: (value: string) => void;
  onRemoveCustomPrompt: (value: string) => void;
  onRunPrompt: (prompt: string) => void;
  onBatchRunAll: () => void;
};

export function PromptHubTab({
  customPrompts,
  brandName,
  busy,
  activeProviderCount,
  onAddCustomPrompt,
  onRemoveCustomPrompt,
  onRunPrompt,
  onBatchRunAll,
}: PromptHubTabProps) {
  const [newPrompt, setNewPrompt] = useState("");
  const [limitHit, setLimitHit] = useState(false);

  const isMultiPromptBlocked = customPrompts.length > 1;

  const interpolateBrand = (value: string) => {
    return value.replace(/\{([^}]+)\}/g, (_, token: string) => {
      if (token.toLowerCase() === "brand") return brandName?.trim() || token;
      return token;
    });
  };

  function handleRunPrompt(prompt: string) {
    if (isMultiPromptBlocked) {
      setLimitHit(true);
      return;
    }
    onRunPrompt(prompt);
  }

  function handleBatchRunAll() {
    if (isMultiPromptBlocked) {
      setLimitHit(true);
      return;
    }
    onBatchRunAll();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-th-border bg-th-card-alt p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-medium uppercase tracking-wider text-th-text-muted">
            Tracking Prompt Library
          </div>
          {customPrompts.length > 0 && (
            <button
              disabled={busy || isMultiPromptBlocked}
              onClick={handleBatchRunAll}
              className="bd-btn-primary rounded-lg px-3 py-1.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              title={
                isMultiPromptBlocked
                  ? "Only 1 prompt can be run at a time in this demo"
                  : `Run all ${customPrompts.length} prompts × ${activeProviderCount} model${activeProviderCount > 1 ? "s" : ""}`
              }
            >
              ▶ Run All ({customPrompts.length} × {activeProviderCount})
            </button>
          )}
        </div>

        {limitHit && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-[var(--accent-warning,#f59e0b)] bg-[rgba(245,158,11,0.08)] px-3 py-2 text-xs text-[var(--accent-warning,#f59e0b)]">
            <span>⚠</span>
            <span>You are in demo mode and are only allowed to run 1 prompt at a time.</span>
            <button
              onClick={() => setLimitHit(false)}
              className="ml-auto shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            >
              ✕
            </button>
          </div>
        )}

        <p className="mb-3 text-sm text-th-text-secondary">
          Add the exact prompts you want to track over time. Use <span className="font-semibold">{"{brand}"}</span> to inject your brand name.
          {activeProviderCount > 1 && (
            <span className="ml-1 text-th-text-accent">· Runs across {activeProviderCount} selected models in parallel.</span>
          )}
        </p>

        <div className="mb-3 flex gap-2">
          <input
            value={newPrompt}
            onChange={(e) => setNewPrompt(e.target.value)}
            placeholder="e.g. Best alternatives to {brand} for B2B SEO analytics"
            className="bd-input w-full rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={() => {
              onAddCustomPrompt(newPrompt);
              setNewPrompt("");
            }}
            className="bd-btn-primary rounded-lg px-4 py-2 text-sm"
          >
            Add
          </button>
        </div>

        <ul className="max-h-[400px] space-y-2 overflow-auto pr-1 text-sm">
          {customPrompts.length === 0 && (
            <li className="text-th-text-secondary">No custom prompts added yet.</li>
          )}
          {customPrompts.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="rounded-lg border border-th-border bg-th-card p-3"
            >
              <div className="mb-2 line-clamp-3 text-th-text">{interpolateBrand(item)}</div>
              <div className="flex gap-2">
                <button
                  disabled={busy || isMultiPromptBlocked}
                  onClick={() => handleRunPrompt(interpolateBrand(item))}
                  className="bd-btn-primary rounded-md px-3 py-1.5 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                  title={isMultiPromptBlocked ? "Only 1 prompt can be run at a time in this demo" : "Run this prompt"}
                >
                  Run
                </button>
                <button
                  onClick={() => onRemoveCustomPrompt(item)}
                  className="bd-chip rounded-md px-3 py-1.5 text-xs"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
