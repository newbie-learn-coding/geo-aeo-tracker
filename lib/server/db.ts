import { supabase } from "./supabase";
import { queryToSlug, domainToSlug } from "./slugify";

// ── Types matching DB tables ─────────────────────────

export type ScrapeRow = {
  id: string;
  provider: string;
  query_slug: string;
  prompt: string;
  answer: string;
  sources: string[];
  visibility_score: number | null;
  sentiment: string | null;
  brand_mentions: string[] | null;
  competitor_mentions: string[] | null;
  ip: string | null;
  created_at: string;
};

export type AuditRow = {
  id: string;
  domain_slug: string;
  url: string;
  score: number;
  checks: unknown;
  ip: string | null;
  created_at: string;
};

// ── Writes (fire-and-forget, never throw) ────────────

export async function saveScrapeToDB(data: {
  provider: string;
  prompt: string;
  answer: string;
  sources: string[];
  visibilityScore?: number;
  sentiment?: string;
  brandMentions?: string[];
  competitorMentions?: string[];
  ip?: string;
}): Promise<void> {
  try {
    const query_slug = queryToSlug(data.prompt);
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const { error } = await supabase.from("scrape_results").upsert(
      {
        provider: data.provider,
        query_slug,
        prompt: data.prompt,
        answer: data.answer,
        sources: data.sources,
        visibility_score: data.visibilityScore ?? null,
        sentiment: data.sentiment ?? null,
        brand_mentions: data.brandMentions ?? null,
        competitor_mentions: data.competitorMentions ?? null,
        ip: data.ip ?? null,
        run_date: today,
      },
      { onConflict: "provider,query_slug,run_date", ignoreDuplicates: true }
    );

    if (error) {
      console.error("[db] saveScrapeToDB failed:", error.message);
    }
  } catch (err) {
    console.error("[db] saveScrapeToDB exception:", err);
  }
}

export async function saveAuditToDB(data: {
  url: string;
  score: number;
  checks: unknown;
  ip?: string;
}): Promise<void> {
  try {
    const domain_slug = domainToSlug(data.url);
    const today = new Date().toISOString().slice(0, 10);

    const { error } = await supabase.from("audit_results").upsert(
      {
        domain_slug,
        url: data.url,
        score: data.score,
        checks: data.checks,
        ip: data.ip ?? null,
        run_date: today,
      },
      { onConflict: "domain_slug,run_date", ignoreDuplicates: true }
    );

    if (error) {
      console.error("[db] saveAuditToDB failed:", error.message);
    }
  } catch (err) {
    console.error("[db] saveAuditToDB exception:", err);
  }
}

// ── Reads (fail-open, return null/empty on error) ────

export async function getRecentScrapeBySlug(slug: string): Promise<ScrapeRow[] | null> {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("scrape_results")
      .select("*")
      .eq("query_slug", slug)
      .gt("created_at", cutoff)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[db] getRecentScrapeBySlug failed:", error.message);
      return null;
    }

    return data as ScrapeRow[];
  } catch (err) {
    console.error("[db] getRecentScrapeBySlug exception:", err);
    return null;
  }
}

export async function getRecentAuditByDomain(domainSlug: string): Promise<AuditRow | null> {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("audit_results")
      .select("*")
      .eq("domain_slug", domainSlug)
      .gt("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error("[db] getRecentAuditByDomain failed:", error.message);
      return null;
    }

    return data as AuditRow;
  } catch (err) {
    console.error("[db] getRecentAuditByDomain exception:", err);
    return null;
  }
}

export async function listAllSlugs(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("scrape_results")
      .select("query_slug")
      .order("query_slug");

    if (error) {
      console.error("[db] listAllSlugs failed:", error.message);
      return [];
    }

    // Deduplicate client-side (Supabase doesn't support DISTINCT directly)
    const slugs = [...new Set((data ?? []).map((r: { query_slug: string }) => r.query_slug))];
    return slugs;
  } catch (err) {
    console.error("[db] listAllSlugs exception:", err);
    return [];
  }
}

export async function listAllDomains(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("audit_results")
      .select("domain_slug")
      .order("domain_slug");

    if (error) {
      console.error("[db] listAllDomains failed:", error.message);
      return [];
    }

    const domains = [...new Set((data ?? []).map((r: { domain_slug: string }) => r.domain_slug))];
    return domains;
  } catch (err) {
    console.error("[db] listAllDomains exception:", err);
    return [];
  }
}
