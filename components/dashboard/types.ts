export type Provider =
  | "chatgpt"
  | "perplexity"
  | "copilot"
  | "gemini"
  | "google_ai"
  | "grok";

export type ScrapeRun = {
  provider: Provider;
  prompt: string;
  answer: string;
  sources: string[];
  createdAt: string;
  /** 0-100 visibility score based on brand mention, position, sentiment */
  visibilityScore: number;
  /** Detected sentiment of the response toward the brand */
  sentiment: "positive" | "neutral" | "negative" | "not-mentioned";
  /** Brand names/aliases that were found in the answer */
  brandMentions: string[];
  /** Competitor names found in the answer */
  competitorMentions: string[];
  /** Whether this run has been scored by the AI analyzer (vs heuristics) */
  aiAnalyzed?: boolean;
};

export type AuditCheck = {
  id: string;
  label: string;
  category: "discovery" | "structure" | "content" | "technical" | "rendering";
  pass: boolean;
  value: string;
  detail: string;
};

export type AuditReport = {
  url: string;
  score: number;
  checks: AuditCheck[];
  /** Legacy fields kept for backward compat */
  llmsTxtPresent: boolean;
  schemaMentions: number;
  blufDensity: number;
  pass: {
    llmsTxt: boolean;
    schema: boolean;
    bluf: boolean;
  };
};

export type BrandConfig = {
  brandName: string;
  brandAliases: string;
  website: string;
  industry: string;
  keywords: string;
  description: string;
};

/** Workspace for multi-brand tracking */
export type Workspace = {
  id: string;
  brandName: string;
  createdAt: string;
};

export const ALL_PROVIDERS: Provider[] = [
  "chatgpt", "perplexity", "copilot", "gemini", "google_ai", "grok",
];

export const PROVIDER_LABELS: Record<Provider, string> = {
  chatgpt: "ChatGPT",
  perplexity: "Perplexity",
  copilot: "Copilot",
  gemini: "Gemini",
  google_ai: "Google AI",
  grok: "Grok",
};

/** Computed delta for a prompt+provider pair between runs */
export type RunDelta = {
  prompt: string;
  provider: Provider;
  currentScore: number;
  previousScore: number;
  delta: number;
  currentRun: ScrapeRun;
  previousRun: ScrapeRun;
};

export type AppState = {
  brand: BrandConfig;
  provider: Provider;
  /** Multiple providers selected for parallel runs */
  activeProviders: Provider[];
  prompt: string;
  customPrompts: string[];
  personas: string;
  fanoutPrompts: string[];
  niche: string;
  nicheQueries: string[];
  competitors: string;
  runs: ScrapeRun[];
  auditUrl: string;
  auditReport: AuditReport | null;
};

export const tabs = [
  "Project Settings",
  "Prompt Hub",
  "Persona Fan-Out",
  "Niche Explorer",
  "Responses",
  "Visibility Analytics",
  "Citations",
  "Citation Opportunities",
  "AEO Audit",
  "Documentation",
] as const;

export type TabKey = (typeof tabs)[number];
