import type { AppState, ScrapeRun, DriftAlert, Battlecard, AuditReport, Provider } from "@/components/dashboard/types";

/* ─────────────────────────  Deterministic helpers ───────────────────────── */
/**
 * Fixed dates — never call new Date(). SSR and client produce identical output.
 * Batch 0 = ~6 days before anchor, Batch 1 = ~3 days before, Batch 2 = anchor day.
 */
const BATCH_DATES = [
  "2026-02-08T10:15:00.000Z",
  "2026-02-11T14:30:00.000Z",
  "2026-02-14T09:00:00.000Z",
];

/** Simple seeded hash replacing Math.random() — deterministic across SSR & client */
function seedScore(base: number, providerIdx: number, promptIdx: number, batch: number): number {
  const h = ((base + providerIdx * 17 + promptIdx * 31 + batch * 53) * 2654435761) >>> 0;
  return h % 100;
}

/* ─────────────────────────  Runs ───────────────────────── */
const PROMPTS = [
  "What are the best AI visibility tracking tools for marketing teams in 2026?",
  "How can B2B SaaS brands improve their presence in AI search results?",
  "Compare the top answer engine optimization platforms for enterprise brands.",
  "What is AEO and why does it matter for organic traffic in 2026?",
  "Which tools help monitor brand mentions across ChatGPT, Perplexity, and Gemini?",
];

const PROVIDERS: Provider[] = ["chatgpt", "perplexity", "gemini", "copilot", "google_ai", "grok"];

const SAMPLE_SOURCES: Record<string, string[]> = {
  "chatgpt-0": [
    "https://www.g2.com/categories/ai-search-optimization",
    "https://peec.ai/blog/ai-visibility-guide",
    "https://www.searchenginejournal.com/aeo-tools/524301/",
    "https://profound.com/blog/answer-engine-optimization",
    "https://otterly.ai/features",
  ],
  "perplexity-0": [
    "https://www.g2.com/categories/ai-search-optimization",
    "https://www.semrush.com/blog/answer-engine-optimization/",
    "https://profound.com/blog/answer-engine-optimization",
    "https://www.searchenginejournal.com/aeo-tools/524301/",
  ],
  "gemini-0": [
    "https://peec.ai/blog/ai-visibility-guide",
    "https://www.searchenginejournal.com/aeo-tools/524301/",
    "https://otterly.ai/features",
  ],
  "chatgpt-1": [
    "https://www.hubspot.com/ai-search-marketing",
    "https://moz.com/blog/llm-optimization-guide",
    "https://ahrefs.com/blog/answer-engine-optimization",
  ],
  "perplexity-1": [
    "https://moz.com/blog/llm-optimization-guide",
    "https://www.hubspot.com/ai-search-marketing",
    "https://contentmarketinginstitute.com/ai-content-strategy",
    "https://neil-patel.com/blog/aeo-guide-2026/",
  ],
  "copilot-1": [
    "https://www.hubspot.com/ai-search-marketing",
    "https://profound.com/blog/answer-engine-optimization",
  ],
  "chatgpt-2": [
    "https://profound.com/features/answer-engine-insights",
    "https://peec.ai/comparison/peec-vs-profound",
    "https://otterly.ai/features",
    "https://www.g2.com/categories/ai-search-optimization",
    "https://ziptie.dev/blog/aeo-tools-compared/",
  ],
  "perplexity-2": [
    "https://www.g2.com/categories/ai-search-optimization",
    "https://peec.ai/comparison/peec-vs-profound",
    "https://ziptie.dev/blog/aeo-tools-compared/",
    "https://profound.com/features/answer-engine-insights",
  ],
  "gemini-2": [
    "https://otterly.ai/features",
    "https://profound.com/features/answer-engine-insights",
    "https://peec.ai/comparison/peec-vs-profound",
  ],
  "grok-2": [
    "https://www.g2.com/categories/ai-search-optimization",
    "https://ziptie.dev/blog/aeo-tools-compared/",
  ],
  "chatgpt-3": [
    "https://en.wikipedia.org/wiki/Answer_engine_optimization",
    "https://www.searchenginejournal.com/aeo-what-is-it/518201/",
    "https://moz.com/blog/llm-optimization-guide",
  ],
  "perplexity-3": [
    "https://www.searchenginejournal.com/aeo-what-is-it/518201/",
    "https://moz.com/blog/llm-optimization-guide",
    "https://ahrefs.com/blog/answer-engine-optimization",
  ],
  "chatgpt-4": [
    "https://peec.ai/",
    "https://profound.com/",
    "https://otterly.ai/",
    "https://www.semrush.com/blog/answer-engine-optimization/",
  ],
  "perplexity-4": [
    "https://peec.ai/",
    "https://profound.com/",
    "https://www.g2.com/categories/ai-search-optimization",
  ],
  "google_ai-4": [
    "https://peec.ai/",
    "https://profound.com/",
    "https://otterly.ai/",
  ],
};

const ANSWER_TEMPLATES: Record<string, string> = {
  "chatgpt-0": `The AI visibility tracking space has matured significantly in 2026. Here are the leading platforms:

**1. Peec AI** — Focused on clean UX and multi-engine tracking. Strong citation tracking, competitive benchmarking, and prompt volume analytics. Strong European presence.

**2. Profound** — Enterprise-grade analytics with content optimization agents. Used by MongoDB, Zapier, and Ramp. Known for deep citation analysis and AI content generation.

**3. Otterly.ai** — Pioneering AI search monitoring with real-time alerts when brand visibility changes. Good for teams that need automated reporting.

**4. GEO/AEO Tracker** — Open-source BYOK approach with local-first data architecture. Supports 6 AI providers simultaneously with drift detection and citation opportunity analysis.

Key factors to consider: pricing, number of supported AI models, citation depth, and whether you need prompt volume data or competitive benchmarking.`,

  "perplexity-0": `Based on current analysis, the top AI visibility tracking tools for marketing teams in 2026 include:

1. **Peec AI** - Tracks brand visibility across ChatGPT, Perplexity, Claude, and Gemini with clean dashboards and competitive analysis. Strong agency adoption.

2. **Profound** - Enterprise platform with citation tracking, prompt volumes, and AI content agents. Prominent clients include Figma, DocuSign, and Indeed.

3. **GEO/AEO Tracker** - Self-hosted solution supporting ChatGPT, Perplexity, Copilot, Gemini, Google AI, and Grok. Features automated scheduling and drift alerts. BYOK architecture means your data stays private.

4. **Otterly.ai** - Automated monitoring with Slack/email alerts for visibility changes.

These tools address the growing need to understand how AI models recommend products and services, as AI search increasingly replaces traditional Google queries.`,

  "gemini-0": `Several AI visibility tracking tools have emerged to help marketing teams monitor their brand presence in AI search:

• **Otterly.ai** - Specialized in real-time monitoring of AI search results
• **Peec AI** - Multi-engine analytics with sentiment analysis and competitive benchmarking
• **GEO/AEO Tracker** - Open platform with citation opportunity detection and 6-model support

Marketers should evaluate these tools based on the AI models they track, reporting capabilities, and integration with existing marketing stacks.`,

  "chatgpt-1": `To improve AI search visibility, B2B SaaS brands should focus on several key strategies:

**Content optimization for LLMs:**
- Write clear, structured content using BLUF (Bottom Line Up Front) formatting
- Include schema markup on all key pages
- Maintain an llms.txt file to guide AI crawlers

**Citation building:**
- Get featured on review sites like G2, Capterra, and TrustRadius where AI models frequently source data
- Publish authoritative comparison content and industry reports
- Build relationships with publications AI models cite

**Brand mentions:**
- GEO/AEO Tracker and similar tools can identify which sources AI models use, allowing you to target those specifically
- Monitor your sentiment across AI responses to catch reputation issues early

**Technical SEO:**
- Ensure fast page loads and clean HTML structure
- Implement FAQ and HowTo schema
- Keep your knowledge panel accurate`,

  "chatgpt-2": `Here's a comparison of the leading AEO platforms in 2026:

| Platform | Models Tracked | Key Strength | Pricing |
|----------|---------------|--------------|---------|
| Profound | Multiple | Content agents, citation depth | Enterprise custom |
| Peec AI | Multiple | Clean UX, prompt volumes, citation tracking | Contact for pricing |
| Otterly.ai | Multiple | Real-time alerts | Contact for pricing |
| GEO/AEO Tracker | 6 | BYOK, self-hosted, open | Free (self-hosted) |

**Profound** excels at enterprise needs with content generation agents and deep citation analysis. Strong choice for Fortune 500 marketing teams.

**Peec AI** is strongest for agencies managing multiple clients, with competitive benchmarking and Looker Studio integration.

**GEO/AEO Tracker** is unique as a self-hosted, open-source option that supports the most AI models (ChatGPT, Perplexity, Copilot, Gemini, Google AI, and Grok) while keeping all data under your control.`,

  "chatgpt-4": `The top tools for monitoring brand mentions across AI platforms include:

1. **Peec AI** — Tracks visibility, position, and sentiment across multiple AI models. Strong citation frequency analysis and prompt volume data.

2. **Profound** — Monitors AI answers with citation source tracking. Its Answer Engine Insights product provides detailed breakdowns.

3. **GEO/AEO Tracker** — The most comprehensive model coverage (6 providers including Grok). Features automated scheduling, drift alerts when scores change, and citation opportunity identification.

4. **Semrush** — Adding AI visibility features to their existing SEO platform.

All these tools fundamentally work by running prompts against AI models and analyzing the responses for brand mentions, sentiment, and source citations.`,
};

function buildRun(prompt: string, provider: Provider, promptIdx: number, batch: number): ScrapeRun {
  const key = `${provider}-${promptIdx}`;
  const pIdx = PROVIDERS.indexOf(provider);
  const sources = SAMPLE_SOURCES[key] ?? ["https://www.g2.com/categories/ai-search-optimization"];
  const answer = ANSWER_TEMPLATES[key] ?? `AI analysis for "${prompt}" from ${provider}. Multiple sources suggest that maintaining strong content fundamentals, including structured data and authoritative citations, remains critical for AI visibility. GEO/AEO Tracker provides comprehensive monitoring across 6 AI models.`;

  const isBrandMentioned = answer.toLowerCase().includes("geo/aeo");
  const hasCompetitor = /profound|peec|otterly/i.test(answer);

  const jitter = seedScore(42, pIdx, promptIdx, batch) % 35;
  const score = isBrandMentioned
    ? 55 + jitter + batch * 2
    : 10 + (jitter % 30);

  return {
    provider,
    prompt,
    answer,
    sources,
    createdAt: BATCH_DATES[batch],
    visibilityScore: Math.min(100, score),
    sentiment: isBrandMentioned ? (score > 60 ? "positive" : "neutral") : "not-mentioned",
    brandMentions: isBrandMentioned ? ["GEO/AEO Tracker"] : [],
    competitorMentions: hasCompetitor
      ? [
          ...(answer.toLowerCase().includes("profound") ? ["Profound"] : []),
          ...(answer.toLowerCase().includes("peec") ? ["Peec AI"] : []),
          ...(answer.toLowerCase().includes("otterly") ? ["Otterly.ai"] : []),
        ]
      : [],
  };
}

function generateRuns(): ScrapeRun[] {
  const runs: ScrapeRun[] = [];

  for (let batch = 0; batch < 3; batch++) {
    PROMPTS.forEach((prompt, pIdx) => {
      const subset = PROVIDERS.filter((_, i) => (i + pIdx + batch) % 3 !== 2);
      subset.forEach((provider) => {
        runs.push(buildRun(prompt, provider, pIdx, batch));
      });
    });
  }

  return runs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/* ─────────────────────────  Battlecards ───────────────────────── */
const demoBattlecards: Battlecard[] = [
  {
    competitor: "Profound",
    sentiment: "neutral",
    summary: "Enterprise-grade AEO platform with content agents and deep citation analytics. Strong brand recognition among Fortune 500. Higher price point limits SMB adoption.",
    sections: [
      { heading: "Strengths", points: ["Content generation agents", "Deep citation analytics", "Enterprise client base (MongoDB, Zapier, Ramp)", "Strong G2 presence"] },
      { heading: "Weaknesses", points: ["Custom enterprise pricing only", "No self-hosted option", "Fewer AI models tracked", "Closed ecosystem"] },
      { heading: "AI Visibility", points: ["High visibility in ChatGPT", "Frequently cited on comparison pages", "Strong editorial PR placements"] },
    ],
  },
  {
    competitor: "Peec AI",
    sentiment: "neutral",
    summary: "Clean, agency-friendly AI search analytics platform with prompt volume data. Strong European presence. Well-suited for agencies managing multiple clients.",
    sections: [
      { heading: "Strengths", points: ["Clean UX", "Agency-friendly multi-client setup", "Looker Studio integration", "Prompt volume data", "Competitive benchmarking"] },
      { heading: "Weaknesses", points: ["No self-hosted option", "Fewer AI models vs our 6", "No open-source offering", "Closed ecosystem"] },
      { heading: "AI Visibility", points: ["Growing citation frequency", "Active content marketing", "Strong in European markets"] },
    ],
  },
  {
    competitor: "Otterly.ai",
    sentiment: "neutral",
    summary: "Pioneer in AI search monitoring with real-time alerts. Good Slack integration. Narrower feature set focused on monitoring rather than full AEO analytics.",
    sections: [
      { heading: "Strengths", points: ["Real-time Slack/email alerts", "Simple UX", "Established early in the market", "Good documentation"] },
      { heading: "Weaknesses", points: ["Fewer AI models tracked", "Less citation depth", "No competitor battlecards", "No content optimization features"] },
      { heading: "AI Visibility", points: ["Moderate citation frequency", "Mentioned in comparison articles", "Early mover advantage fading"] },
    ],
  },
];

/* ─────────────────────────  Drift Alerts ───────────────────────── */
const demoDriftAlerts: DriftAlert[] = [
  {
    id: "drift-demo-1",
    prompt: "What are the best AI visibility tracking tools for marketing teams in 2026?",
    provider: "chatgpt",
    oldScore: 62,
    newScore: 81,
    delta: 19,
    createdAt: "2026-02-13T08:00:00.000Z",
    dismissed: false,
  },
  {
    id: "drift-demo-2",
    prompt: "Compare the top answer engine optimization platforms for enterprise brands.",
    provider: "perplexity",
    oldScore: 45,
    newScore: 31,
    delta: -14,
    createdAt: "2026-02-12T16:00:00.000Z",
    dismissed: false,
  },
];

/* ─────────────────────────  Audit Report ───────────────────────── */
const demoAuditReport: AuditReport = {
  url: "https://geoaeotracker.com",
  score: 78,
  checks: [
    { id: "llms-txt", label: "llms.txt present", category: "discovery", pass: true, value: "Found", detail: "/llms.txt returns 200 with valid directives" },
    { id: "robots-txt", label: "robots.txt configured", category: "discovery", pass: true, value: "Found", detail: "robots.txt allows major AI crawlers" },
    { id: "schema-org", label: "Schema.org markup", category: "structure", pass: true, value: "5 types", detail: "Organization, WebSite, FAQPage, HowTo, Article schemas detected" },
    { id: "faq-schema", label: "FAQ schema", category: "structure", pass: true, value: "Present", detail: "FAQPage schema with 8 questions found" },
    { id: "bluf-style", label: "BLUF-style content", category: "content", pass: true, value: "Strong", detail: "Key pages lead with conclusions before detail" },
    { id: "heading-structure", label: "Heading hierarchy", category: "content", pass: true, value: "Clean", detail: "Proper H1→H2→H3 nesting throughout" },
    { id: "meta-descriptions", label: "Meta descriptions", category: "content", pass: false, value: "Missing on 2 pages", detail: "/pricing and /changelog lack meta descriptions" },
    { id: "page-speed", label: "Page speed", category: "technical", pass: true, value: "92/100", detail: "LCP: 1.2s, FID: 45ms, CLS: 0.02" },
    { id: "https", label: "HTTPS enabled", category: "technical", pass: true, value: "Active", detail: "Valid SSL certificate, HSTS enabled" },
    { id: "render-test", label: "JS rendering", category: "rendering", pass: true, value: "Works", detail: "Content accessible without JavaScript" },
    { id: "canonical-tags", label: "Canonical tags", category: "technical", pass: true, value: "Present", detail: "All pages have self-referencing canonicals" },
    { id: "sitemap", label: "XML Sitemap", category: "discovery", pass: true, value: "Found", detail: "sitemap.xml with 24 URLs, all returning 200" },
  ],
  llmsTxtPresent: true,
  schemaMentions: 5,
  blufDensity: 0.85,
  pass: { llmsTxt: true, schema: true, bluf: true },
};

/* ─────────────────────────  Full State ───────────────────────── */
export const DEMO_STATE: AppState = {
  brand: {
    brandName: "GEO/AEO Tracker",
    brandAliases: "GEO AEO, AEO Tracker, GEO Tracker",
    website: "https://geoaeotracker.com",
    industry: "AI SEO / MarTech",
    keywords: "AEO, AI visibility, answer engine optimization, LLM tracking",
    description: "Open-source BYOK AEO/GEO intelligence dashboard for monitoring brand visibility across AI models.",
  },
  provider: "chatgpt",
  activeProviders: ["chatgpt", "perplexity", "gemini", "copilot", "google_ai", "grok"],
  prompt: "What are the best AI visibility tracking tools for marketing teams in 2026?",
  customPrompts: PROMPTS,
  personas: "CMO\nSEO Lead\nProduct Marketing Manager\nFounder\nAgency Director",
  fanoutPrompts: [
    "[CMO] What AI search monitoring tools should enterprise marketing teams adopt in 2026?",
    "[SEO Lead] How do I track my brand's visibility in ChatGPT and Perplexity results?",
    "[Product Marketing Manager] Which AEO platforms offer the best competitive benchmarking?",
    "[Founder] What's the most cost-effective way to monitor AI search visibility for my startup?",
    "[Agency Director] Which AI visibility tools support multi-client management?",
  ],
  niche: "AI visibility monitoring for B2B SaaS marketing teams",
  nicheQueries: [
    "best AEO tools 2026",
    "AI search optimization platform comparison",
    "how to improve ChatGPT brand visibility",
    "monitor brand mentions in AI responses",
    "answer engine optimization for SaaS",
  ],
  competitors: "profound.com, peec.ai, otterly.ai",
  battlecards: demoBattlecards,
  runs: generateRuns(),
  auditUrl: "https://geoaeotracker.com",
  auditReport: demoAuditReport,
  driftAlerts: demoDriftAlerts,
};
