"use client";

import { useState } from "react";

type DocSection = {
  id: string;
  title: string;
  icon: string;
  content: string[];
};

const sections: DocSection[] = [
  {
    id: "overview",
    title: "Overview",
    icon: "📖",
    content: [
      "The GEO/AEO Tracker is a local-first, open-source intelligence dashboard that monitors how your brand appears across AI models — ChatGPT, Perplexity, Gemini, Copilot, Google AI, and Grok.",
      "All data is stored in your browser (localStorage + IndexedDB). Nothing leaves your machine unless you explicitly trigger a scrape or analysis via the configured API.",
      "Key capabilities: multi-model brand tracking, visibility scoring, sentiment analysis, citation discovery, competitor battlecards, AEO site audits, and automation templates.",
    ],
  },
  {
    id: "project-settings",
    title: "Project Settings",
    icon: "⚙️",
    content: [
      "Configure your brand identity: name, aliases, website URL, industry, target keywords, and a short description.",
      "This context is injected into every AI prompt so that analysis stays relevant to your business.",
      "Brand aliases let you track abbreviations or informal names (e.g., 'BD' for 'Bright Data').",
      "You can reset all data from this tab if you need a clean slate.",
    ],
  },
  {
    id: "prompt-hub",
    title: "Prompt Hub",
    icon: "💬",
    content: [
      "Build a library of tracking prompts. Use {brand} as a placeholder — it will be replaced with your brand name at runtime.",
      "Run a single prompt against all active models, or batch-run your entire library in one click.",
      "Prompts are stored per workspace, so each brand can have its own prompt set.",
      "Tip: Include 'with sources' or 'include references' in your prompts to encourage AI models to cite URLs you can analyze in the Citations tab.",
    ],
  },
  {
    id: "persona-fanout",
    title: "Persona Fan-Out",
    icon: "👥",
    content: [
      "Write one core query and define a list of personas (CMO, SEO Lead, Founder, etc.).",
      "The system generates persona-specific prompt variants automatically.",
      "Run each variant independently to see how different audience angles change model responses and brand visibility.",
      "This helps identify which buyer personas your brand resonates with most across AI models.",
    ],
  },
  {
    id: "niche-explorer",
    title: "Niche Explorer",
    icon: "🔍",
    content: [
      "Enter your niche or product category and generate high-intent search queries that real buyers would type into AI assistants.",
      "Queries are AI-generated and focus on informational, comparison, and decision-stage intent.",
      "Add any generated query directly to your Prompt Hub for ongoing tracking.",
      "Use this to build a comprehensive monitoring set beyond the prompts you can think of yourself.",
    ],
  },
  {
    id: "responses",
    title: "Responses",
    icon: "📝",
    content: [
      "Browse all collected AI model responses grouped by prompt.",
      "Each response shows: provider badge, visibility score (0–100), sentiment tag, brand/competitor highlights, and cited sources.",
      "Filter by model, sentiment, or sort by date or score.",
      "The insight strip at the top shows aggregate stats: average score, brand mention rate, sentiment breakdown, and per-model averages.",
      "Expand any response card to read the full AI answer with brand terms highlighted in blue and competitor terms in orange.",
    ],
  },
  {
    id: "visibility-analytics",
    title: "Visibility Analytics",
    icon: "📊",
    content: [
      "Track your brand's average visibility score over time with a trend line chart.",
      "The chart plots daily average visibility % across all prompts and models.",
      "Summary cards show overall average visibility, and sentiment distribution (positive, neutral, negative, not-mentioned).",
      "Export all run data or trend data as CSV for external analysis.",
    ],
  },
  {
    id: "citations",
    title: "Citations",
    icon: "🔗",
    content: [
      "Analyze which URLs and domains AI models cite most frequently in their responses.",
      "View a bar chart of top cited domains, search by URL or domain, sort by citations/pages/prompts/alphabetical.",
      "Toggle between domain-level and URL-level views.",
      "Filter by minimum citation count and export the full table as CSV.",
      "Your own website is badged with a 'Your site' indicator so you can quickly see if your domain is being cited.",
      "Citation Opportunities KPI: counts unique domains cited in responses where your brand was NOT mentioned — these are outreach targets.",
    ],
  },
  {
    id: "aeo-audit",
    title: "AEO Audit",
    icon: "✅",
    content: [
      "Enter any URL to run an Answer Engine Optimization audit.",
      "Checks include: llms.txt presence, schema/structured data signals, BLUF (Bottom Line Up Front) content clarity, and technical readiness.",
      "Each check is categorized (discovery, structure, content, technical, rendering) with pass/fail status and details.",
      "The overall score (0–100) tells you how ready the page is to be surfaced in AI-generated answers.",
    ],
  },
  {
    id: "automation",
    title: "Automation",
    icon: "⚡",
    content: [
      "Store deployment-ready scheduling templates for recurring prompt runs.",
      "Cron expression editor for Vercel Cron or server-side scheduling.",
      "GitHub Actions workflow template for CI/CD-based automated tracking.",
      "Copy either template directly into your infrastructure for hands-off monitoring.",
    ],
  },
  {
    id: "workspaces",
    title: "Multi-Brand Workspaces",
    icon: "🏢",
    content: [
      "Create separate workspaces for each brand or client you track.",
      "Each workspace has its own settings, prompts, runs, and data — fully isolated.",
      "Switch between workspaces instantly via the sidebar brand picker.",
      "All workspace data is stored locally in your browser.",
    ],
  },
  {
    id: "scoring",
    title: "Visibility Scoring",
    icon: "🎯",
    content: [
      "Each AI response is scored 0–100 based on how prominently your brand appears:",
      "• Brand mentioned at all → +30 points",
      "• Mentioned in the first 200 characters (prominent position) → +20 points",
      "• Multiple mentions: 2+ times → +8, 3+ times → +15 points",
      "• Your website URL cited in sources → +20 points",
      "• Positive sentiment detected → +15 points, Neutral → +5 points",
      "Scores are capped at 100. A score of 0 means the brand was not mentioned at all.",
    ],
  },
  {
    id: "models",
    title: "Supported AI Models",
    icon: "🤖",
    content: [
      "The tracker supports 6 AI model providers via Bright Data's Scraper API:",
      "• ChatGPT — OpenAI's conversational model",
      "• Perplexity — Search-focused AI with real-time citations",
      "• Copilot — Microsoft's AI assistant",
      "• Gemini — Google's multimodal AI",
      "• Google AI — Google AI Overview / SGE results",
      "• Grok — xAI's model",
      "Toggle models on/off in the toolbar. Run prompts across any combination simultaneously.",
    ],
  },
  {
    id: "data-privacy",
    title: "Data & Privacy",
    icon: "🔒",
    content: [
      "All data is stored locally in your browser using localStorage and IndexedDB.",
      "No data is sent to any server except when you explicitly run a scrape (via Bright Data API) or an analysis (via your configured LLM API).",
      "You can export all data as CSV from the Analytics tab.",
      "Use the Reset Data button in Project Settings to permanently delete all stored data for the active workspace.",
      "BYOK (Bring Your Own Key) architecture — you provide your own API keys.",
    ],
  },
];

export function DocumentationTab() {
  const [activeSection, setActiveSection] = useState("overview");
  const [search, setSearch] = useState("");

  const filteredSections = search.trim()
    ? sections.filter(
        (s) =>
          s.title.toLowerCase().includes(search.toLowerCase()) ||
          s.content.some((line) => line.toLowerCase().includes(search.toLowerCase())),
      )
    : sections;

  const current = sections.find((s) => s.id === activeSection);

  return (
    <div className="flex gap-4">
      {/* Sidebar TOC */}
      <div className="w-52 shrink-0">
        <div className="mb-3">
          <input
            type="text"
            placeholder="Search docs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bd-input w-full rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <nav className="space-y-0.5 max-h-[65vh] overflow-y-auto">
          {filteredSections.map((section) => (
            <button
              key={section.id}
              onClick={() => {
                setActiveSection(section.id);
                setSearch("");
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${
                activeSection === section.id
                  ? "bg-th-accent-soft text-th-text-accent font-medium"
                  : "text-th-text-secondary hover:bg-th-card-hover hover:text-th-text"
              }`}
            >
              <span className="text-sm">{section.icon}</span>
              <span className="truncate">{section.title}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {current ? (
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="text-2xl">{current.icon}</span>
              <h2 className="text-lg font-semibold text-th-text">{current.title}</h2>
            </div>
            <div className="space-y-3">
              {current.content.map((line, i) => {
                if (line.startsWith("• ")) {
                  return (
                    <div key={i} className="ml-4 flex items-start gap-2 text-sm text-th-text-secondary leading-relaxed">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-th-accent" />
                      <span>{line.slice(2)}</span>
                    </div>
                  );
                }
                return (
                  <p key={i} className="text-sm leading-relaxed text-th-text-secondary">
                    {line}
                  </p>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-th-text-muted">
            {search ? `No documentation matches "${search}".` : "Select a section from the sidebar."}
          </div>
        )}

        {/* Quick nav */}
        {current && (
          <div className="mt-6 flex items-center gap-2 border-t border-th-border pt-4">
            {(() => {
              const idx = sections.findIndex((s) => s.id === current.id);
              const prev = idx > 0 ? sections[idx - 1] : null;
              const next = idx < sections.length - 1 ? sections[idx + 1] : null;
              return (
                <>
                  {prev && (
                    <button
                      onClick={() => setActiveSection(prev.id)}
                      className="flex items-center gap-1.5 rounded-lg border border-th-border px-3 py-1.5 text-xs text-th-text-secondary hover:bg-th-card-hover transition-colors"
                    >
                      ← {prev.title}
                    </button>
                  )}
                  <div className="flex-1" />
                  {next && (
                    <button
                      onClick={() => setActiveSection(next.id)}
                      className="flex items-center gap-1.5 rounded-lg border border-th-border px-3 py-1.5 text-xs text-th-text-secondary hover:bg-th-card-hover transition-colors"
                    >
                      {next.title} →
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
