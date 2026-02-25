"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { loadSovereignValue, saveSovereignValue, clearSovereignStore } from "@/lib/client/sovereign-store";
import { DEMO_STATE } from "@/lib/demo-data";
import { AeoAuditTab } from "@/components/dashboard/tabs/aeo-audit-tab";
import { AutomationTab } from "@/components/dashboard/tabs/automation-tab-v2";
import { CitationOpportunitiesTab } from "@/components/dashboard/tabs/citation-opportunities-tab";
import { NicheExplorerTab } from "@/components/dashboard/tabs/niche-explorer-tab";
import { FanOutTab } from "@/components/dashboard/tabs/fan-out-tab";
import { PartnerDiscoveryTab } from "@/components/dashboard/tabs/partner-discovery-tab";
import { ProjectSettingsTab } from "@/components/dashboard/tabs/project-settings-tab";
import { PromptHubTab } from "@/components/dashboard/tabs/prompt-hub-tab";
import { ReputationSourcesTab } from "@/components/dashboard/tabs/reputation-sources-tab";
import { VisibilityAnalyticsTab } from "@/components/dashboard/tabs/visibility-analytics-tab";
import { DocumentationTab } from "@/components/dashboard/tabs/documentation-tab";
import { DemoLimitModal } from "@/components/dashboard/demo-limit-modal";
import type { AppState, DriftAlert, Provider, RunDelta, ScrapeRun, TabKey, Workspace } from "@/components/dashboard/types";
import { ALL_PROVIDERS, PROVIDER_LABELS, SCHEDULE_OPTIONS, tabs } from "@/components/dashboard/types";

/* ── Inline SVG icon helpers (16×16) ─────────────────────────────── */
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      {children}
    </svg>
  );
}

const tabIcons: Record<TabKey, ReactNode> = {
  "Project Settings": (
    <Icon>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </Icon>
  ),
  "Prompt Hub": (
    <Icon>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </Icon>
  ),
  "Persona Fan-Out": (
    <Icon>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Icon>
  ),
  "Niche Explorer": (
    <Icon>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </Icon>
  ),
  Automation: (
    <Icon>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </Icon>
  ),
  Responses: (
    <Icon>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M8 9h8M8 13h6" />
    </Icon>
  ),
  "Visibility Analytics": (
    <Icon>
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </Icon>
  ),
  Citations: (
    <Icon>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </Icon>
  ),
  "Citation Opportunities": (
    <Icon>
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </Icon>
  ),
  "AEO Audit": (
    <Icon>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </Icon>
  ),
  Documentation: (
    <Icon>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 7h8M8 11h6" />
    </Icon>
  ),
};

const STORAGE_KEY = "sovereign-aeo-tracker-v1";
const WORKSPACES_KEY = "sovereign-workspaces";
const ACTIVE_WS_KEY = "sovereign-active-workspace";
// THEME_KEY removed — dark mode only

function storageKeyForWorkspace(wsId: string) {
  return wsId === "default" ? STORAGE_KEY : `sovereign-aeo-tracker-${wsId}`;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

const defaultState: AppState = {
  brand: {
    brandName: "",
    brandAliases: "",
    website: "",
    industry: "",
    keywords: "",
    description: "",
  },
  provider: "chatgpt",
  activeProviders: ["chatgpt"],
  prompt:
    "What is the strongest value proposition for sovereign AI analytics tools in 2026? Include sources.",
  customPrompts: [],
  personas: "CMO\nSEO Lead\nProduct Marketing Manager\nFounder",
  fanoutPrompts: [],
  niche: "AI SEO platform for B2B SaaS",
  nicheQueries: [],
  cronExpr: "0 */6 * * *",
  githubWorkflow:
    "name: sovereign-aeo\non:\n  schedule:\n    - cron: '0 */6 * * *'\njobs:\n  track:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm ci && npm run test:scraper",
  competitors: "profound.com, otterly.ai, peec.ai",
  runs: [],
  auditUrl: "https://example.com",
  auditReport: null,
  scheduleEnabled: false,
  scheduleIntervalMs: 21600000,
  lastScheduledRun: null,
  driftAlerts: [],
};

const tabMeta: Record<TabKey, { title: string; tooltip: string; details: string }> = {
  "Project Settings": {
    title: "Project Settings",
    tooltip: "Set your brand, site, keywords, and context.",
    details:
      "Define the exact brand and website to track. This context is reused across analysis flows so outputs stay targeted to your business.",
  },
  "Prompt Hub": {
    title: "Prompt Hub",
    tooltip: "Manage your tracking prompt library.",
    details:
      "Build a library of prompts to track over time. Use {brand} to inject your brand name. Run individual prompts or batch-run all across selected models.",
  },
  "Persona Fan-Out": {
    title: "Persona Fan-Out",
    tooltip: "Create and run persona-specific prompt variants.",
    details:
      "Write one core query, define personas, and generate persona-specific variants. Run each variant independently to compare how different audience angles change model responses.",
  },
  "Niche Explorer": {
    title: "Niche Explorer",
    tooltip: "Generate high-intent GEO/AEO queries.",
    details:
      "Build a reusable bank of niche prompts focused on discoverability, citations, and buyer intent so your tracking set stays comprehensive.",
  },
  Automation: {
    title: "Automation",
    tooltip: "Configure recurring runs via cron/workflows.",
    details:
      "Store deployment-ready scheduling templates for Vercel Cron and GitHub Actions so tracking can run automatically on a repeat cadence.",
  },
  Responses: {
    title: "Responses",
    tooltip: "Browse AI model responses with brand highlighting.",
    details:
      "Browse all collected AI responses. Brand and competitor mentions are highlighted in-context. View visibility scores, sentiment, and cited sources per response.",
  },
  "Visibility Analytics": {
    title: "Analytics",
    tooltip: "Track visibility score and sentiment trends over time.",
    details:
      "Monitor your brand visibility score over time, track sentiment distribution across responses, and export data as CSV for further analysis.",
  },
  Citations: {
    title: "Citations",
    tooltip: "Analyze cited sources grouped by domain.",
    details:
      "See which domains and URLs get cited most in AI responses. Group by domain to find citation hubs, or search by URL for specific sources. Export data as CSV.",
  },
  "Citation Opportunities": {
    title: "Citation Opps",
    tooltip: "Competitor-cited sources where you're not mentioned.",
    details:
      "Discover high-value outreach targets: URLs where AI models cite your competitors but don't mention your brand. Each opportunity includes an outreach brief.",
  },
  "AEO Audit": {
    title: "AEO Audit",
    tooltip: "Audit site readiness for LLM discovery.",
    details:
      "Run checks for llms.txt, schema signals, and BLUF-style clarity indicators to quickly assess AI-answer readiness of a target URL.",
  },
  Documentation: {
    title: "Documentation",
    tooltip: "Learn about every feature in the tracker.",
    details:
      "A comprehensive guide to all tabs, features, scoring methodology, supported models, and data privacy. Searchable and browsable.",
  },
};

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function SovereignDashboard({ demoMode = false }: { demoMode?: boolean } = {}) {
  const [activeTab, setActiveTab] = useState<TabKey>("Project Settings");
  const [state, setState] = useState<AppState>(demoMode ? DEMO_STATE : defaultState);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(demoMode ? "Demo mode — read-only preview" : "");

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWsId, setActiveWsId] = useState<string>("default");
  const [showWsPicker, setShowWsPicker] = useState(false);
  const [showScoreInfo, setShowScoreInfo] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);


  /** Load workspaces on mount */
  useEffect(() => {
    if (demoMode) return; // Skip workspace loading in demo mode

    // Workspaces
    try {
      const raw = localStorage.getItem(WORKSPACES_KEY);
      const parsed: Workspace[] = raw ? JSON.parse(raw) : [];
      if (parsed.length === 0) {
        // Create default workspace
        const defaultWs: Workspace = { id: "default", brandName: "Default", createdAt: new Date().toISOString() };
        parsed.push(defaultWs);
        localStorage.setItem(WORKSPACES_KEY, JSON.stringify(parsed));
      }
      setWorkspaces(parsed);
      const savedActiveId = localStorage.getItem(ACTIVE_WS_KEY) ?? parsed[0].id;
      setActiveWsId(savedActiveId);
    } catch {
      const defaultWs: Workspace = { id: "default", brandName: "Default", createdAt: new Date().toISOString() };
      setWorkspaces([defaultWs]);
      setActiveWsId("default");
    }
  }, []);

  /** Load app state for active workspace */
  useEffect(() => {
    if (demoMode || !activeWsId) return;
    let mounted = true;
    const key = storageKeyForWorkspace(activeWsId);
    loadSovereignValue<AppState>(key, defaultState).then((data) => {
      if (mounted) {
        // Merge saved state with defaults so new fields are never undefined
        const merged: AppState = {
          ...defaultState,
          ...data,
          brand: { ...defaultState.brand, ...(data.brand ?? {}) },
          provider: ALL_PROVIDERS.includes(data.provider as Provider)
            ? (data.provider as Provider)
            : defaultState.provider,
          activeProviders: Array.isArray(data.activeProviders)
            ? data.activeProviders.filter((provider): provider is Provider =>
                ALL_PROVIDERS.includes(provider as Provider),
              )
            : [],
        };
        if (merged.activeProviders.length === 0) {
          merged.activeProviders = [merged.provider];
        }
        setState(merged);
      }
    });
    return () => {
      mounted = false;
    };
  }, [activeWsId]);

  useEffect(() => {
    if (demoMode || !activeWsId) return;
    saveSovereignValue(storageKeyForWorkspace(activeWsId), state);
    // Update workspace brandName if changed
    if (state.brand.brandName) {
      setWorkspaces((prev) => {
        const updated = prev.map((ws) =>
          ws.id === activeWsId ? { ...ws, brandName: state.brand.brandName || ws.brandName } : ws,
        );
        localStorage.setItem(WORKSPACES_KEY, JSON.stringify(updated));
        return updated;
      });
    }
  }, [state, activeWsId]);

  /** ref to the scheduler interval so we can clear/re-create it */
  const schedulerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /** ref to latest state so the scheduler callback doesn't close over stale state */
  const stateRef = useRef(state);
  stateRef.current = state;
  const busyRef = useRef(busy);
  busyRef.current = busy;

  /** ref to latest callScrapeOne so the scheduler callback doesn't use stale brand terms */
  const callScrapeOneRef = useRef<(prompt: string, provider: Provider) => Promise<ScrapeRun | null>>(
    // placeholder — will be assigned after callScrapeOne is defined
    async () => null,
  );

  /** Detect drift after a batch of new runs */
  function detectDrift(newRuns: ScrapeRun[], existingRuns: ScrapeRun[]): DriftAlert[] {
    const alerts: DriftAlert[] = [];
    const DRIFT_THRESHOLD = 10; // minimum score change to trigger alert

    newRuns.forEach((newRun) => {
      // Find the most recent existing run with same prompt+provider
      const prev = existingRuns.find(
        (r) => r.prompt === newRun.prompt && r.provider === newRun.provider,
      );
      if (!prev) return;
      const delta = (newRun.visibilityScore ?? 0) - (prev.visibilityScore ?? 0);
      if (Math.abs(delta) >= DRIFT_THRESHOLD) {
        alerts.push({
          id: `drift-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          prompt: newRun.prompt,
          provider: newRun.provider,
          oldScore: prev.visibilityScore ?? 0,
          newScore: newRun.visibilityScore ?? 0,
          delta,
          createdAt: new Date().toISOString(),
          dismissed: false,
        });
      }
    });

    return alerts;
  }

  /** Run a scheduled batch and detect drift */
  const runScheduledBatch = useCallback(async () => {
    const s = stateRef.current;
    if (busyRef.current) return; // skip if already running
    const prompts = s.customPrompts.length > 0 ? s.customPrompts : [s.prompt];
    const providers = s.activeProviders;
    if (prompts.length === 0 || providers.length === 0) return;

    setBusy(true);
    setMessage("Auto-run: Starting scheduled batch…");

    const allRuns: ScrapeRun[] = [];
    for (const prompt of prompts) {
      const results = await Promise.allSettled(
        providers.map((p) => callScrapeOneRef.current(prompt, p)),
      );
      for (const r of results) {
        if (r.status === "fulfilled" && r.value) allRuns.push(r.value);
      }
    }

    // Detect drift against existing runs
    const newAlerts = detectDrift(allRuns, s.runs);

    setState((prev) => ({
      ...prev,
      runs: [...allRuns, ...prev.runs].slice(0, 500),
      lastScheduledRun: new Date().toISOString(),
      driftAlerts: [...newAlerts, ...prev.driftAlerts].slice(0, 100),
    }));

    setMessage(
      `Auto-run complete: ${allRuns.length} results.${newAlerts.length > 0 ? ` ${newAlerts.length} drift alert${newAlerts.length > 1 ? "s" : ""} triggered.` : ""}`,
    );
    setBusy(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Set up / tear down the scheduler interval */
  useEffect(() => {
    if (schedulerRef.current) {
      clearInterval(schedulerRef.current);
      schedulerRef.current = null;
    }
    if (!demoMode && state.scheduleEnabled && state.scheduleIntervalMs > 0) {
      schedulerRef.current = setInterval(runScheduledBatch, state.scheduleIntervalMs);
    }
    return () => {
      if (schedulerRef.current) {
        clearInterval(schedulerRef.current);
        schedulerRef.current = null;
      }
    };
  }, [state.scheduleEnabled, state.scheduleIntervalMs, runScheduledBatch]);

  function dismissAlert(id: string) {
    setState((prev) => ({
      ...prev,
      driftAlerts: prev.driftAlerts.map((a) =>
        a.id === id ? { ...a, dismissed: true } : a,
      ),
    }));
  }

  function dismissAllAlerts() {
    setState((prev) => ({
      ...prev,
      driftAlerts: prev.driftAlerts.map((a) => ({ ...a, dismissed: true })),
    }));
  }

  function switchWorkspace(wsId: string) {
    if (demoMode) { setMessage("Demo mode — workspaces are read-only"); return; }
    // Save current state first
    saveSovereignValue(storageKeyForWorkspace(activeWsId), state);
    setActiveWsId(wsId);
    localStorage.setItem(ACTIVE_WS_KEY, wsId);
    setShowWsPicker(false);
    setMessage(`Switched to ${workspaces.find((w) => w.id === wsId)?.brandName ?? "workspace"}`);
  }

  function createWorkspace(name: string) {
    if (demoMode) { setMessage("Demo mode — workspaces are read-only"); return; }
    const ws: Workspace = { id: generateId(), brandName: name, createdAt: new Date().toISOString() };
    const updated = [...workspaces, ws];
    setWorkspaces(updated);
    localStorage.setItem(WORKSPACES_KEY, JSON.stringify(updated));
    // Save current, switch to new
    saveSovereignValue(storageKeyForWorkspace(activeWsId), state);
    setState({ ...defaultState, brand: { ...defaultState.brand, brandName: name } });
    setActiveWsId(ws.id);
    localStorage.setItem(ACTIVE_WS_KEY, ws.id);
    setShowWsPicker(false);
    setMessage(`Created workspace: ${name}`);
  }

  function deleteWorkspace(wsId: string) {
    if (demoMode) { setMessage("Demo mode — workspaces are read-only"); return; }
    if (workspaces.length <= 1) return;
    if (!window.confirm("Delete this workspace and all its data?")) return;
    const updated = workspaces.filter((w) => w.id !== wsId);
    setWorkspaces(updated);
    localStorage.setItem(WORKSPACES_KEY, JSON.stringify(updated));
    clearSovereignStore(storageKeyForWorkspace(wsId));
    if (activeWsId === wsId) {
      switchWorkspace(updated[0].id);
    }
  }

  const partnerLeaderboard = useMemo(() => {
    // Client-side junk URL filter as safety net
    const junkHosts = [
      "cloudfront.net", "cdn.prod.website-files.com", "cdn.jsdelivr.net",
      "cdnjs.cloudflare.com", "unpkg.com", "fastly.net", "akamaihd.net",
      "connect.facebook.net", "facebook.net", "google-analytics.com",
      "googletagmanager.com", "doubleclick.net", "w3.org", "schema.org",
      "amazonaws.com", "cloudflare.com", "hotjar.com", "sentry.io",
    ];
    const junkExtPattern = /\.(png|jpe?g|gif|svg|webp|avif|ico|css|js|woff2?|ttf|eot|mp4|webm)(\?|$)/i;

    function isCleanUrl(url: string): boolean {
      try {
        const parsed = new URL(url);
        const host = parsed.hostname.toLowerCase();
        if (junkHosts.some((j) => host === j || host.endsWith(`.${j}`))) return false;
        if (junkExtPattern.test(parsed.pathname)) return false;
        if (parsed.search.length > 200) return false;
        return true;
      } catch {
        return false;
      }
    }

    const map = new Map<string, { count: number; prompts: Set<string> }>();
    state.runs.forEach((run) => {
      run.sources.filter(isCleanUrl).forEach((source) => {
        const existing = map.get(source) ?? { count: 0, prompts: new Set<string>() };
        existing.count += 1;
        existing.prompts.add(run.prompt);
        map.set(source, existing);
      });
    });

    return [...map.entries()]
      .map(([url, data]) => ({ url, count: data.count, prompts: [...data.prompts] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);
  }, [state.runs]);

  const visibilityTrend = useMemo(() => {
    const byDay = new Map<string, { total: number; sum: number }>();

    state.runs.forEach((run) => {
      const day = run.createdAt.slice(0, 10);
      const row = byDay.get(day) ?? { total: 0, sum: 0 };
      row.total += 1;
      row.sum += run.visibilityScore ?? 0;
      byDay.set(day, row);
    });

    return [...byDay.entries()]
      .map(([day, { total, sum }]) => ({
        day,
        visibility: total > 0 ? Math.round(sum / total) : 0,
      }))
      .sort((a, b) => a.day.localeCompare(b.day));
  }, [state.runs]);

  const totalSources = useMemo(
    () => state.runs.reduce((acc, run) => acc + run.sources.length, 0),
    [state.runs],
  );

  /** Count unique domains cited in runs where the brand was NOT mentioned — these are outreach targets */
  const citationOpportunities = useMemo(() => {
    const domains = new Set<string>();
    state.runs
      .filter((r) => r.sentiment === "not-mentioned" || (r.brandMentions?.length ?? 0) === 0)
      .forEach((r) => {
        r.sources.forEach((url) => {
          try {
            const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
            domains.add(host);
          } catch { /* skip */ }
        });
      });
    return domains.size;
  }, [state.runs]);

  const latestRun = state.runs[0];

  /** Compute score deltas: for each prompt+provider, compare latest run to the previous one */
  const runDeltas: RunDelta[] = useMemo(() => {
    const grouped = new Map<string, ScrapeRun[]>();
    state.runs.forEach((run) => {
      const key = `${run.prompt}|||${run.provider}`;
      const list = grouped.get(key) ?? [];
      list.push(run);
      grouped.set(key, list);
    });

    const deltas: RunDelta[] = [];
    grouped.forEach((runs) => {
      // Sort newest first
      const sorted = [...runs].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      if (sorted.length < 2) return;
      const curr = sorted[0];
      const prev = sorted[1];
      const d = (curr.visibilityScore ?? 0) - (prev.visibilityScore ?? 0);
      if (d !== 0) {
        deltas.push({
          prompt: curr.prompt,
          provider: curr.provider,
          currentScore: curr.visibilityScore ?? 0,
          previousScore: prev.visibilityScore ?? 0,
          delta: d,
          currentRun: curr,
          previousRun: prev,
        });
      }
    });

    return deltas.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  }, [state.runs]);

  /** Top movers — biggest absolute delta changes */
  const movers = useMemo(() => runDeltas.slice(0, 5), [runDeltas]);

  /** KPI delta: compare current period avg visibility vs prior period */
  const kpiVisibilityDelta = useMemo(() => {
    if (state.runs.length < 2) return null;
    const sorted = [...state.runs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const mid = Math.floor(sorted.length / 2);
    const recentHalf = sorted.slice(0, mid);
    const olderHalf = sorted.slice(mid);
    if (recentHalf.length === 0 || olderHalf.length === 0) return null;
    const recentAvg = recentHalf.reduce((a, r) => a + (r.visibilityScore ?? 0), 0) / recentHalf.length;
    const olderAvg = olderHalf.reduce((a, r) => a + (r.visibilityScore ?? 0), 0) / olderHalf.length;
    return Math.round(recentAvg - olderAvg);
  }, [state.runs]);

  /** Unread drift alerts count */
  const unreadAlertCount = useMemo(
    () => state.driftAlerts.filter((a) => !a.dismissed).length,
    [state.driftAlerts],
  );

  /** Brand context string injected into AI prompts when available */
  const brandCtx = state.brand.brandName
    ? `Context: Brand "${state.brand.brandName}"${state.brand.website ? ` (${state.brand.website})` : ""}${state.brand.industry ? `, industry: ${state.brand.industry}` : ""}${state.brand.keywords ? `, keywords: ${state.brand.keywords}` : ""}. `
    : "";

  /** Build list of brand names/aliases to detect */
  function getBrandTerms(): string[] {
    const terms: string[] = [];
    if (state.brand.brandName?.trim()) terms.push(state.brand.brandName.trim());
    if (state.brand.brandAliases?.trim()) {
      (state.brand.brandAliases ?? "").split(",").forEach((a) => {
        const t = a.trim();
        if (t) terms.push(t);
      });
    }
    return terms;
  }

  function getCompetitorTerms(): string[] {
    return state.competitors
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
  }

  /** Find which terms appear in text (case-insensitive) */
  function findMentions(text: string, terms: string[]): string[] {
    const lower = text.toLowerCase();
    return terms.filter((t) => lower.includes(t.toLowerCase()));
  }

  /** Detect basic sentiment toward brand in answer */
  function detectSentiment(
    answer: string,
    brandTerms: string[],
  ): "positive" | "neutral" | "negative" | "not-mentioned" {
    if (brandTerms.length === 0) return "not-mentioned";
    const lower = answer.toLowerCase();
    const mentioned = brandTerms.some((t) => lower.includes(t.toLowerCase()));
    if (!mentioned) return "not-mentioned";

    const positiveWords = [
      "best", "leading", "top", "excellent", "recommend", "great", "outstanding",
      "innovative", "trusted", "powerful", "superior", "preferred", "popular",
      "reliable", "impressive", "standout", "strong", "ideal",
    ];
    const negativeWords = [
      "worst", "poor", "bad", "avoid", "lacking", "weak", "inferior",
      "disappointing", "overpriced", "limited", "outdated", "risky",
      "problematic", "concern", "drawback", "downside",
    ];

    let posScore = 0;
    let negScore = 0;
    positiveWords.forEach((w) => { if (lower.includes(w)) posScore++; });
    negativeWords.forEach((w) => { if (lower.includes(w)) negScore++; });

    if (posScore > negScore + 1) return "positive";
    if (negScore > posScore + 1) return "negative";
    return "neutral";
  }

  /** Calculate 0-100 visibility score */
  function calcVisibilityScore(
    answer: string,
    sources: string[],
    brandTerms: string[],
  ): number {
    if (brandTerms.length === 0) return 0;
    const lower = answer.toLowerCase();
    let score = 0;

    // Brand mentioned at all? +30
    const mentioned = brandTerms.some((t) => lower.includes(t.toLowerCase()));
    if (!mentioned) return 0;
    score += 30;

    // Mentioned in first 200 chars (prominent position)? +20
    const first200 = lower.slice(0, 200);
    if (brandTerms.some((t) => first200.includes(t.toLowerCase()))) score += 20;

    // Multiple mentions? +15
    const mentionCount = brandTerms.reduce((acc, t) => {
      const re = new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      return acc + (lower.match(re)?.length ?? 0);
    }, 0);
    if (mentionCount >= 3) score += 15;
    else if (mentionCount >= 2) score += 8;

    // Brand website in sources? +20
    const websiteDomain = state.brand.website
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "")
      .toLowerCase();
    if (websiteDomain && sources.some((s) => s.toLowerCase().includes(websiteDomain))) {
      score += 20;
    }

    // Positive sentiment bonus +15
    const sent = detectSentiment(answer, brandTerms);
    if (sent === "positive") score += 15;
    else if (sent === "neutral") score += 5;

    return Math.min(100, score);
  }

  /** Run a single scrape against one specific provider (trigger + poll) */
  async function callScrapeOne(prompt: string, provider: Provider): Promise<ScrapeRun | null> {
    if (demoMode) { setMessage("Demo mode — API calls are disabled"); return null; }
    try {
      console.log(`[scrape] callScrapeOne: START provider=${provider} prompt="${prompt.slice(0, 80)}..."`);

      // Trigger — returns immediately with a jobId
      const triggerRes = await fetch(`${BASE_PATH}/api/scrape/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, prompt, requireSources: true }),
      });
      const triggerData = await triggerRes.json();
      if (triggerRes.status === 429 && triggerData.rateLimited) {
        console.log(`[scrape] callScrapeOne: Rate limited provider=${provider}`);
        setShowDemoModal(true);
        return null;
      }
      if (!triggerRes.ok) {
        console.error(`[scrape] callScrapeOne: Trigger FAILED provider=${provider} status=${triggerRes.status} error="${triggerData.error}"`);
        throw new Error(triggerData.error || "Trigger failed");
      }
      const { jobId } = triggerData as { jobId: string };
      console.log(`[scrape] callScrapeOne: Triggered provider=${provider} jobId=${jobId}`);

      // Poll until ready, failed, or 90s timeout
      const POLL_INTERVAL_MS = 2000;
      const TIMEOUT_MS = 240_000;
      const deadline = Date.now() + TIMEOUT_MS;
      let pollCount = 0;

      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        pollCount++;

        const statusRes = await fetch(`${BASE_PATH}/api/scrape/status/${jobId}`);
        const statusData = await statusRes.json() as {
          status: "pending" | "ready" | "failed";
          result?: { provider: string; prompt: string; answer: string; sources: string[]; createdAt: string };
          error?: string;
        };

        console.log(`[scrape] callScrapeOne: Poll #${pollCount} jobId=${jobId} provider=${provider} status=${statusData.status}`);

        if (statusData.status === "failed") {
          console.error(`[scrape] callScrapeOne: Job FAILED jobId=${jobId} provider=${provider} error="${statusData.error}"`);
          throw new Error(statusData.error || "Scrape job failed");
        }

        if (statusData.status === "ready" && statusData.result) {
          const { answer: answerText, sources: sourceList, provider: p, prompt: pr, createdAt } = statusData.result;
          console.log(`[scrape] callScrapeOne: READY provider=${provider} jobId=${jobId} answer.length=${answerText.length} sources=${sourceList.length}`);

          // AI-powered analysis (accumulation: only new runs get analyzed)
          let visibilityScore: number;
          let sentiment: ScrapeRun["sentiment"];
          let brandMentions: string[];
          let competitorMentions: string[];
          let aiAnalyzed = false;

          try {
            const analysisRes = await fetch(`${BASE_PATH}/api/analyze-run`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                answer: answerText,
                brandName: state.brand.brandName,
                brandAliases: state.brand.brandAliases,
                brandWebsite: state.brand.website,
                competitors: state.competitors,
              }),
            });
            if (analysisRes.ok) {
              const analysis = await analysisRes.json() as {
                visibilityScore: number;
                sentiment: ScrapeRun["sentiment"];
                brandMentioned: boolean;
                brandMentions: string[];
                competitorMentions: string[];
              };
              visibilityScore = analysis.visibilityScore;
              sentiment = analysis.sentiment;
              brandMentions = analysis.brandMentions;
              competitorMentions = analysis.competitorMentions;
              aiAnalyzed = true;
              console.log(`[scrape] callScrapeOne: AI analysis done provider=${provider} score=${visibilityScore} sentiment=${sentiment}`);
            } else {
              throw new Error(`analyze-run HTTP ${analysisRes.status}`);
            }
          } catch (analysisErr) {
            console.warn(`[scrape] callScrapeOne: AI analysis failed, falling back to heuristics. Error:`, analysisErr instanceof Error ? analysisErr.message : analysisErr);
            const brandTerms = getBrandTerms();
            const competitorTerms = getCompetitorTerms();
            visibilityScore = calcVisibilityScore(answerText, sourceList, brandTerms);
            sentiment = detectSentiment(answerText, brandTerms);
            brandMentions = findMentions(answerText, brandTerms);
            competitorMentions = findMentions(answerText, competitorTerms);
          }

          return {
            provider: p as Provider,
            prompt: pr,
            answer: answerText,
            sources: sourceList,
            createdAt: createdAt || new Date().toISOString(),
            visibilityScore,
            sentiment,
            brandMentions,
            competitorMentions,
            aiAnalyzed,
          };
        }
        // status === "pending" → keep polling
      }

      console.error(`[scrape] callScrapeOne: TIMED OUT provider=${provider} jobId=${jobId} after ${pollCount} polls`);
      throw new Error("Timed out waiting for scrape result");
    } catch (err) {
      console.error(`[scrape] callScrapeOne: CAUGHT ERROR provider=${provider}`, err instanceof Error ? err.message : err);
      return null;
    }
  }

  // Keep the ref up-to-date so the scheduler always uses latest brand/competitor terms
  callScrapeOneRef.current = callScrapeOne;

  /** Run a prompt across all activeProviders in parallel */
  async function callScrape(prompt: string) {
    // Interpolate {brand} before sending to the scraper
    const interpolated = prompt.replace(/\{([^}]+)\}/g, (_, token: string) => {
      if (token.toLowerCase() === "brand") return state.brand.brandName || "our brand";
      return token;
    });
    const providers = state.activeProviders.length > 0
      ? state.activeProviders
      : [state.provider];
    const count = providers.length;
    setBusy(true);
    setMessage(`Running across ${count} model${count > 1 ? "s" : ""}...`);

    try {
      const results = await Promise.allSettled(
        providers.map((p) => callScrapeOne(interpolated, p)),
      );

      const runs: ScrapeRun[] = results
        .map((r) => (r.status === "fulfilled" ? r.value : null))
        .filter((r): r is ScrapeRun => r !== null);

      if (runs.length === 0) {
        setMessage("All scrape requests failed. Check your Bright Data config.");
        return;
      }

      setState((prev) => ({
        ...prev,
        runs: [...runs, ...prev.runs].slice(0, 500),
      }));

      const failed = count - runs.length;
      setMessage(
        `Done: ${runs.length}/${count} model${count > 1 ? "s" : ""} returned results.${failed > 0 ? ` ${failed} failed.` : ""}`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to run scraper.");
    } finally {
      setBusy(false);
    }
  }

  /** Batch run all custom prompts across all active providers */
  async function batchRunAllPrompts() {
    const prompts = state.customPrompts.map((p) =>
      p.replace(/\{([^}]+)\}/g, (_, token: string) => {
        if (token.toLowerCase() === "brand") return state.brand.brandName || "our brand";
        return token;
      }),
    );
    if (prompts.length === 0) {
      setMessage("No tracking prompts to run. Add prompts first.");
      return;
    }
    const providers = state.activeProviders.length > 0
      ? state.activeProviders
      : [state.provider];
    const totalJobs = prompts.length * providers.length;
    setBusy(true);

    let completed = 0;
    let failed = 0;
    const allRuns: ScrapeRun[] = [];

    for (const prompt of prompts) {
      setMessage(`Batch: ${completed}/${totalJobs} done...`);
      const results = await Promise.allSettled(
        providers.map((p) => callScrapeOne(prompt, p)),
      );
      for (const r of results) {
        if (r.status === "fulfilled" && r.value) {
          allRuns.push(r.value);
          completed++;
        } else {
          failed++;
          completed++;
        }
      }
    }

    setState((prev) => ({
      ...prev,
      runs: [...allRuns, ...prev.runs].slice(0, 500),
    }));

    setMessage(
      `Batch complete: ${allRuns.length} results from ${prompts.length} prompts × ${providers.length} models.${failed > 0 ? ` ${failed} failed.` : ""}`,
    );
    setBusy(false);
  }

  function generatePersonaFanout() {
    const personas = state.personas
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const fanout = personas.map(
      (persona) => `${persona}: ${state.prompt} Respond with sources and direct claims first.`,
    );

    setState((prev) => ({ ...prev, fanoutPrompts: fanout }));
  }

  function addCustomPrompt(value: string) {
    const cleaned = value.trim();
    if (!cleaned) return;
    setState((prev) => {
      if (prev.customPrompts.includes(cleaned)) return prev;
      return { ...prev, customPrompts: [cleaned, ...prev.customPrompts].slice(0, 50) };
    });
    setMessage("Tracking prompt added.");
  }

  function removeCustomPrompt(value: string) {
    setState((prev) => ({
      ...prev,
      customPrompts: prev.customPrompts.filter((entry) => entry !== value),
    }));
  }

  function extractNicheQueries(payload: unknown) {
    const data = payload as { text?: unknown };
    const raw = typeof data.text === "string" ? data.text.trim() : "";

    // Structured output: parse JSON object with queries array
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const obj = parsed as Record<string, unknown>;
        const arr = obj.queries;
        if (Array.isArray(arr)) {
          const items = arr
            .map((item) => (typeof item === "string" ? item.trim() : ""))
            .filter((line) => line.length > 5)
            .slice(0, 20);
          if (items.length > 0) return items;
        }
      }
    } catch {
      // fall through to line parsing
    }

    // Fallback: line-by-line parsing
    const cleaned = raw.replace(/```[\w]*\n?/g, "").trim();
    const fromLines = cleaned
      .split("\n")
      .map((line) =>
        line
          .replace(/^\s*[-*•]\s+/, "")
          .replace(/^\s*\d+[.)]\s+/, "")
          .replace(/^\s*"|"\s*$/g, "")
          .replace(/^\*\*(.+?)\*\*$/, "$1")
          .replace(/^"+|"+$/g, "")
          .trim(),
      )
      .filter((line) => line.length > 10 && line.length < 300)
      .filter((line) => !/^(here\s+(are|is)|high[- ]intent|sure|certainly|below|the following)\b/i.test(line))
      .filter((line) => line.includes(" "));

    return fromLines.slice(0, 20);
  }

  async function runNicheExplorer() {
    if (demoMode) { setMessage("Demo mode — API calls are disabled"); return; }
    setBusy(true);
    setMessage("Generating niche queries...");

    try {
      const response = await fetch(`${BASE_PATH}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `${brandCtx}Generate exactly 12 high-intent search queries that a buyer or researcher would type into an AI assistant (ChatGPT, Perplexity, Gemini) when exploring this niche: "${state.niche}".

Requirements:
- Each query should be realistic and conversational
- Include source-seeking phrasing like "with sources", "according to experts", etc.
- Mix informational, comparison, and decision-stage queries`,
          maxTokens: 1500,
          skipCache: true,
          schema: {
            name: "niche_queries",
            schema: {
              type: "object",
              properties: {
                queries: {
                  type: "array",
                  description: "List of high-intent search queries",
                  items: { type: "string" },
                },
              },
              required: ["queries"],
              additionalProperties: false,
            },
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Niche generation failed");

      const queries = extractNicheQueries(data);

      setState((prev) => ({ ...prev, nicheQueries: queries }));
      setMessage(
        queries.length > 0
          ? "Niche queries updated."
          : "No valid niche queries returned. Try a more specific niche.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed generating queries.");
    } finally {
      setBusy(false);
    }
  }

  async function runAudit() {
    if (demoMode) { setMessage("Demo mode — API calls are disabled"); return; }
    setBusy(true);
    setMessage("Running AEO audit...");

    try {
      const response = await fetch(`${BASE_PATH}/api/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: state.auditUrl }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Audit failed");

      setState((prev) => ({ ...prev, auditReport: data }));
      setMessage("Audit complete.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed running audit.");
    } finally {
      setBusy(false);
    }
  }

  async function handleResetData() {
    if (demoMode) { setMessage("Demo mode — data cannot be modified"); return; }
    if (!window.confirm("This will delete ALL saved data (runs, prompts, settings). Continue?")) return;
    await clearSovereignStore(storageKeyForWorkspace(activeWsId));
    setState(defaultState);
    setMessage("All data cleared.");
  }

  function renderActiveTab() {
    if (activeTab === "Project Settings") {
      return (
        <ProjectSettingsTab
          brand={state.brand}
          onBrandChange={(patch) =>
            setState((prev) => ({ ...prev, brand: { ...prev.brand, ...patch } }))
          }
          onReset={handleResetData}
        />
      );
    }

    if (activeTab === "Prompt Hub") {
      return (
        <PromptHubTab
          customPrompts={state.customPrompts}
          brandName={state.brand.brandName}
          busy={busy}
          activeProviderCount={state.activeProviders.length}
          onAddCustomPrompt={addCustomPrompt}
          onRemoveCustomPrompt={removeCustomPrompt}
          onRunPrompt={callScrape}
          onBatchRunAll={batchRunAllPrompts}
        />
      );
    }

    if (activeTab === "Persona Fan-Out") {
      return (
        <FanOutTab
          prompt={state.prompt}
          personas={state.personas}
          fanoutPrompts={state.fanoutPrompts}
          busy={busy}
          onPromptChange={(value) => setState((prev) => ({ ...prev, prompt: value }))}
          onPersonasChange={(value) => setState((prev) => ({ ...prev, personas: value }))}
          onGenerateFanout={generatePersonaFanout}
          onRunPrompt={callScrape}
        />
      );
    }

    if (activeTab === "Niche Explorer") {
      return (
        <NicheExplorerTab
          niche={state.niche}
          nicheQueries={state.nicheQueries}
          trackedPrompts={state.customPrompts}
          onNicheChange={(value) => setState((prev) => ({ ...prev, niche: value }))}
          onGenerateQueries={runNicheExplorer}
          onAddToTracking={addCustomPrompt}
        />
      );
    }

    if (activeTab === "Automation") {
      return (
        <AutomationTab
          scheduleEnabled={state.scheduleEnabled}
          scheduleIntervalMs={state.scheduleIntervalMs}
          lastScheduledRun={state.lastScheduledRun}
          driftAlerts={state.driftAlerts}
          busy={busy}
          onToggleSchedule={(enabled) =>
            setState((prev) => ({ ...prev, scheduleEnabled: enabled }))
          }
          onIntervalChange={(interval) =>
            setState((prev) => ({ ...prev, scheduleIntervalMs: interval }))
          }
          onRunNow={runScheduledBatch}
          onDismissAlert={dismissAlert}
          onDismissAllAlerts={dismissAllAlerts}
        />
      );
    }

    if (activeTab === "Responses") {
      return (
        <ReputationSourcesTab
          runs={state.runs}
          brandTerms={getBrandTerms()}
          competitorTerms={getCompetitorTerms()}
          runDeltas={runDeltas}
        />
      );
    }

    if (activeTab === "Visibility Analytics") {
      return <VisibilityAnalyticsTab data={visibilityTrend} runs={state.runs} />;
    }

    if (activeTab === "Citations") {
      return <PartnerDiscoveryTab partnerLeaderboard={partnerLeaderboard} brandWebsite={state.brand.website} />;
    }

    if (activeTab === "Citation Opportunities") {
      return <CitationOpportunitiesTab runs={state.runs} brandWebsite={state.brand.website} />;
    }

    if (activeTab === "Documentation") {
      return <DocumentationTab />;
    }

    return (
      <AeoAuditTab
        auditUrl={state.auditUrl}
        auditReport={state.auditReport}
        onAuditUrlChange={(value) => setState((prev) => ({ ...prev, auditUrl: value }))}
        onRunAudit={runAudit}
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden text-th-text" style={{ background: "var(--bg-deep)" }}>
      {/* ── Rate limit modal ───────────────────────────────── */}
      {showDemoModal && <DemoLimitModal onClose={() => setShowDemoModal(false)} />}

      {/* ── Ambient background layers ─────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bd-bg-ambient" />
        <div className="absolute inset-0 bd-bg-grid opacity-100" />
      </div>

      {/* ── Fixed sidebar ──────────────────────────────────── */}
      <aside className="relative z-10 flex w-[252px] shrink-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-elevated)]" style={{ backdropFilter: "blur(12px)" }}>
        {/* Brand / Workspace switcher */}
        <div className="border-b border-[var(--border-subtle)] px-4 py-3">
          {/* Logo row */}
          <div className="flex items-center gap-2 mb-3">
            <img src={`${BASE_PATH}/brightdata-logo.svg`} alt="Bright Data" className="h-5 w-auto" />
            {demoMode && (
              <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/8 text-[var(--text-tertiary)] border border-[var(--border-subtle)]">
                Demo
              </span>
            )}
          </div>
          {demoMode ? (
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[var(--accent-primary-muted)] border border-[var(--border-accent)]">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-[#9D97F4] to-[#3D7FFC]">
                <span className="text-[11px] font-bold text-white">
                  {(state.brand.brandName || "AE").slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-white">
                  {state.brand.brandName || "AEO Tracker"}
                </div>
                <div className="text-[10px] text-[var(--text-tertiary)]">Read-only demo</div>
              </div>
            </div>
          ) : (
          <>
          <button
            onClick={() => setShowWsPicker(!showWsPicker)}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-white/5 transition-colors border border-transparent hover:border-[var(--border-subtle)]"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-[#9D97F4] to-[#3D7FFC] shrink-0">
              <span className="text-[11px] font-bold text-white">
                {(state.brand.brandName || "AE").slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-white">
                {state.brand.brandName || "AEO Tracker"}
              </div>
              {state.brand.website && (
                <div className="truncate text-[10px] text-[var(--text-tertiary)]">{state.brand.website.replace(/^https?:\/\//, "")}</div>
              )}
            </div>
            <span className="text-[10px] text-[var(--text-disabled)]">{showWsPicker ? "▲" : "▼"}</span>
          </button>

          {/* Workspace dropdown */}
          {showWsPicker && (
            <div className="mt-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-2 shadow-xl">
              <div className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-disabled)]">Workspaces</div>
              <div className="max-h-[200px] space-y-0.5 overflow-auto">
                {workspaces.map((ws) => (
                  <div key={ws.id} className="flex items-center gap-1">
                    <button
                      onClick={() => switchWorkspace(ws.id)}
                      className={`flex-1 rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${
                        ws.id === activeWsId
                          ? "bg-[var(--accent-primary-muted)] text-white font-medium border border-[var(--border-accent)]"
                          : "text-[var(--text-secondary)] hover:bg-white/5"
                      }`}
                    >
                      {ws.brandName || "Untitled"}
                    </button>
                    {workspaces.length > 1 && (
                      <button
                        onClick={() => deleteWorkspace(ws.id)}
                        className="rounded p-1 text-[10px] text-[var(--text-disabled)] hover:text-[var(--accent-error)] hover:bg-[var(--accent-error-muted)]"
                        title="Delete workspace"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  const name = window.prompt("Brand / workspace name:");
                  if (name?.trim()) createWorkspace(name.trim());
                }}
                className="mt-2 flex w-full items-center gap-1.5 rounded-lg border border-dashed border-[var(--border-accent)] px-2 py-1.5 text-xs text-[var(--accent-primary)] hover:bg-[var(--accent-primary-muted)] transition-colors"
              >
                <span>+</span> New Brand
              </button>
            </div>
          )}
          </>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-2">
          {tabs.map((tab) => {
            const active = activeTab === tab;
            const isSettings = tab === "Project Settings";
            return (
              <div key={tab}>
                {isSettings && (
                  <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-disabled)]">
                    Setup
                  </div>
                )}
                <button
                  title={tabMeta[tab].tooltip}
                  onClick={() => setActiveTab(tab)}
                  className={`bd-nav-item mb-0.5 ${active ? "active" : ""}`}
                >
                  <span className={`shrink-0 bd-nav-icon ${active ? "text-[var(--accent-primary)]" : "text-[var(--text-disabled)]"}`}>
                    {tabIcons[tab]}
                  </span>
                  <span className="truncate">{tabMeta[tab].title}</span>
                  {tab === "Automation" && unreadAlertCount > 0 && (
                    <span className="ml-auto rounded-full bg-[var(--accent-error)] px-1.5 py-0.5 text-[9px] font-bold leading-none text-white">
                      {unreadAlertCount}
                    </span>
                  )}
                </button>
                {isSettings && (
                  <div className="mb-1 mt-2 border-t border-[var(--border-subtle)] pt-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-disabled)]">
                    Pillars
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bright Data CTA */}
        <div className="border-t border-[var(--border-subtle)] px-3 py-3">
          <a
            href="https://brightdata.com/?utm_source=geo-tracker-os"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-xl border border-[var(--border-accent)] bg-[var(--accent-primary-muted)] px-3 py-3 transition-all hover:bg-[rgba(61,127,252,0.18)] hover:border-[rgba(61,127,252,0.5)] hover:shadow-[var(--shadow-glow-primary)]"
          >
            <div className="min-w-0 flex-1 flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${BASE_PATH}/brightdata-logo.svg`}
                alt="Bright Data"
                className="h-7 w-auto object-contain"
              />
            </div>
            <svg className="shrink-0 text-[var(--text-tertiary)] group-hover:text-[var(--accent-primary)] transition-colors" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        </div>

      </aside>

      {/* ── Main content ───────────────────────────────────── */}
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        {/* Demo banner */}
        {demoMode && (
          <div className="flex shrink-0 items-center justify-center gap-2 border-b border-[var(--border-accent)] bg-[var(--accent-primary-muted)] px-4 py-2 text-xs font-medium text-[var(--accent-primary)]">
            <div className="bd-dot-live" />
            <span>Read-only demo — data is pre-loaded and API calls are disabled</span>
          </div>
        )}

        {/* Toolbar */}
        <header className="flex shrink-0 items-center gap-2 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/80 px-5 py-2.5" style={{ backdropFilter: "blur(12px)" }}>
          <h1 className="mr-auto text-sm font-semibold text-white">{tabMeta[activeTab].title}</h1>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-disabled)]">Models</span>
          <div className="flex flex-wrap items-center gap-1">
            {ALL_PROVIDERS.map((p) => {
              const active = state.activeProviders.includes(p);
              return (
                <button
                  key={p}
                  onClick={() =>
                    setState((prev) => {
                      const next = active
                        ? prev.activeProviders.filter((x) => x !== p)
                        : [...prev.activeProviders, p];
                      if (next.length === 0) return prev;
                      return { ...prev, activeProviders: next, provider: next[0] };
                    })
                  }
                  className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-all duration-150 ${
                    active
                      ? "bg-gradient-to-r from-[#9D97F4] via-[#3D7FFC] to-[#15C1E6] text-white shadow-[0_2px_8px_rgba(61,127,252,0.3)]"
                      : "bg-white/5 text-[var(--text-tertiary)] border border-[var(--border-subtle)] hover:bg-white/8 hover:text-[var(--text-secondary)]"
                  }`}
                  title={active ? `Deselect ${PROVIDER_LABELS[p]}` : `Select ${PROVIDER_LABELS[p]}`}
                >
                  {PROVIDER_LABELS[p]}
                </button>
              );
            })}
            <button
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  activeProviders: prev.activeProviders.length === ALL_PROVIDERS.length ? [prev.provider] : [...ALL_PROVIDERS],
                }))
              }
              className="ml-0.5 rounded-md border border-[var(--border-default)] px-2 py-0.5 text-[11px] text-[var(--text-tertiary)] hover:bg-white/5 hover:text-[var(--text-secondary)] transition-colors"
              title={state.activeProviders.length === ALL_PROVIDERS.length ? "Select only one" : "Select all models"}
            >
              {state.activeProviders.length === ALL_PROVIDERS.length ? "1" : "All"}
            </button>
          </div>

          {/* Status chip */}
          <span className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] transition-all ${
            busy
              ? "bg-[var(--accent-primary-muted)] text-[var(--accent-primary)] border border-[var(--border-accent)]"
              : "bg-white/5 text-[var(--text-tertiary)] border border-[var(--border-subtle)]"
          }`}>
            {busy && <span className="bd-dot-live" style={{ width: 6, height: 6 }} />}
            {message || "Ready"}
          </span>
        </header>

        {/* Scrollable body */}
        <main className="flex-1 overflow-y-auto px-5 py-4" style={{ background: "transparent" }}>
          {/* Brand not configured warning */}
          {!demoMode && state.runs.length > 0 && !state.brand.brandName.trim() && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-[var(--accent-error-muted)] bg-[var(--accent-error-muted)] px-4 py-3 text-sm text-[var(--accent-error)]">
              <span className="text-base">⚠️</span>
              <span>
                <strong>Brand name not set.</strong> Visibility scores and brand mention detection will be 0 until you configure your brand in{" "}
                <button
                  onClick={() => setActiveTab("Project Settings")}
                  className="underline hover:no-underline font-semibold"
                >
                  Project Settings
                </button>.
              </span>
            </div>
          )}

          {/* KPI strip */}
          <section className="mb-4 grid grid-cols-2 gap-2.5 lg:grid-cols-3 xl:grid-cols-6">
            <KpiCard label="Total Runs" value={state.runs.length} />
            <KpiCard
              label="Avg Visibility"
              value={
                state.runs.length > 0
                  ? `${Math.round(state.runs.reduce((a, r) => a + (r.visibilityScore ?? 0), 0) / state.runs.length)}%`
                  : "—"
              }
              delta={kpiVisibilityDelta}
              small
              onInfoClick={() => setShowScoreInfo(!showScoreInfo)}
            />
            <KpiCard
              label="Brand Mentioned"
              value={state.runs.filter((r) => (r.brandMentions?.length ?? 0) > 0).length}
            />
            <KpiCard label="Captured Sources" value={totalSources} />
            <KpiCard label="Citation Opps" value={citationOpportunities} />
            <KpiCard
              label="Latest Run"
              value={
                latestRun
                  ? latestRun.createdAt.replace("T", " ").slice(0, 16)
                  : "—"
              }
              small
            />
          </section>

          {/* ── Movers strip ── */}
          {movers.length > 0 && (
            <section className="mb-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4" style={{ backdropFilter: "blur(8px)" }}>
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--accent-primary-muted)] text-sm">📊</span>
                <h3 className="text-sm font-semibold text-white">Top Movers</h3>
                <span className="text-xs text-[var(--text-tertiary)]">Biggest visibility changes between runs</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {movers.map((m, i) => {
                  const up = m.delta > 0;
                  return (
                    <div
                      key={`${m.prompt.slice(0, 20)}-${m.provider}-${i}`}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                        up
                          ? "border-[var(--accent-success-muted)] bg-[var(--accent-success-muted)]"
                          : "border-[var(--accent-error-muted)] bg-[var(--accent-error-muted)]"
                      }`}
                    >
                      <span className={`text-base font-bold ${up ? "text-[var(--accent-success)]" : "text-[var(--accent-error)]"}`}>
                        {up ? "↑" : "↓"}{Math.abs(m.delta)}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-xs font-medium text-white" style={{ maxWidth: "180px" }}>
                          {m.prompt.length > 50 ? m.prompt.slice(0, 47) + "…" : m.prompt}
                        </div>
                        <div className="text-[10px] text-[var(--text-tertiary)]">
                          {PROVIDER_LABELS[m.provider]} · {m.previousScore}→{m.currentScore}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Scoring explanation */}
          {showScoreInfo && (
            <section className="mb-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4" style={{ backdropFilter: "blur(8px)" }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">How Visibility Scoring Works</h3>
                <button onClick={() => setShowScoreInfo(false)} className="text-[var(--text-disabled)] hover:text-white text-base transition-colors">✕</button>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mb-3">
                The visibility score (0–100) measures how prominently your brand appears in AI model responses. Each factor contributes points:
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <ScoreFactorCard emoji="🔍" label="Brand Mentioned" points="+30" desc="Your brand name or alias appears in the response" />
                <ScoreFactorCard emoji="🏆" label="Prominent Position" points="+20" desc="Brand is mentioned in the first 200 characters" />
                <ScoreFactorCard emoji="🔁" label="Multiple Mentions" points="+8 to +15" desc="Brand appears 2+ times (8pts) or 3+ times (15pts)" />
                <ScoreFactorCard emoji="🔗" label="Website Cited" points="+20" desc="Your website URL appears in the cited sources" />
                <ScoreFactorCard emoji="👍" label="Positive Sentiment" points="+15" desc="Response uses positive language about your brand" />
                <ScoreFactorCard emoji="😐" label="Neutral Sentiment" points="+5" desc="Response mentions brand in a neutral context" />
              </div>
            </section>
          )}

          {/* Active tab panel */}
          <section className="rounded-xl border border-[var(--border-default)] p-5" style={{ background: "var(--surface-card)", backdropFilter: "blur(8px)" }}>
            {renderActiveTab()}
          </section>
          <section className="mt-3 rounded-lg border border-[var(--border-subtle)] px-4 py-3" style={{ background: "var(--surface-card)" }}>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-disabled)]">What this tab does</div>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">{tabMeta[activeTab].details}</p>
          </section>
        </main>
      </div>
    </div>
  );
}

/* ── Score Factor Card ────────────────────────────────────────── */
function ScoreFactorCard({ emoji, label, points, desc }: { emoji: string; label: string; points: string; desc: string }) {
  return (
    <div className="rounded-lg border border-[var(--border-subtle)] px-3 py-2.5 transition-colors hover:border-[var(--border-default)]" style={{ background: "var(--bg-elevated)" }}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm">{emoji}</span>
        <span className="text-xs font-medium text-white">{label}</span>
        <span className="ml-auto text-xs font-semibold text-[var(--accent-primary)]">{points}</span>
      </div>
      <p className="text-[11px] text-[var(--text-tertiary)] leading-relaxed">{desc}</p>
    </div>
  );
}

/* ── Compact KPI Card ─────────────────────────────────────────── */
function KpiCard({ label, value, small, delta, onInfoClick }: { label: string; value: string | number; small?: boolean; delta?: number | null; onInfoClick?: () => void }) {
  return (
    <div className="bd-kpi group">
      <div className="flex items-center gap-1">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-disabled)]">{label}</div>
        {onInfoClick && (
          <button onClick={onInfoClick} className="text-[var(--text-disabled)] hover:text-[var(--accent-primary)] text-xs transition-colors" title="How is this calculated?">ⓘ</button>
        )}
      </div>
      <div className={`mt-1.5 flex items-center gap-1.5 font-semibold text-white ${small ? "text-sm" : "text-xl"}`}>
        {value}
        {delta != null && delta !== 0 && (
          <span className={`text-[10px] font-bold ${delta > 0 ? "text-[var(--accent-success)]" : "text-[var(--accent-error)]"}`}>
            {delta > 0 ? "↑" : "↓"}{Math.abs(delta)}
          </span>
        )}
      </div>
    </div>
  );
}
