import type { SerpResult, SerpOrganicResult } from "./sro-types";

function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function emptyResult(keyword: string): SerpResult {
  return {
    keyword,
    totalResults: 0,
    organicResults: [],
    targetRank: null,
    topCompetitors: [],
  };
}

export async function fetchSerp(
  keyword: string,
  targetUrl: string
): Promise<SerpResult> {
  const apiKey = process.env.BRIGHT_DATA_KEY;
  const zone = process.env.BRIGHT_DATA_SERP_ZONE || "serp_n8n";

  if (!apiKey) {
    console.error("[SERP] Missing BRIGHT_DATA_KEY");
    return emptyResult(keyword);
  }

  const targetDomain = extractDomain(targetUrl);
  const encodedQuery = encodeURIComponent(keyword);
  const googleUrl = `https://www.google.com/search?q=${encodedQuery}&gl=us&brd_json=1`;

  try {
    const response = await fetch("https://api.brightdata.com/request", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        zone,
        url: googleUrl,
        format: "json",
      }),
    });

    if (!response.ok) {
      console.error(`[SERP] API error: ${response.status} ${response.statusText}`);
      return emptyResult(keyword);
    }

    const data = await response.json();
    const body = typeof data.body === "string" ? JSON.parse(data.body) : data.body;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawOrganic: any[] = body?.organic ?? [];

    let targetRank: number | null = null;
    const organicResults: SerpOrganicResult[] = [];
    const topCompetitors: string[] = [];

    for (const item of rawOrganic) {
      const url = item.link ?? "";
      const domain = extractDomain(url);
      const position = item.rank ?? item.global_rank ?? organicResults.length + 1;
      const isTarget = domain === targetDomain;

      organicResults.push({
        position,
        url,
        domain,
        title: item.title ?? "",
        description: item.description ?? item.snippet ?? "",
        isTarget,
      });

      if (isTarget && targetRank === null) {
        targetRank = position;
      }

      if (!isTarget && topCompetitors.length < 5) {
        topCompetitors.push(url);
      }
    }

    return {
      keyword,
      totalResults: organicResults.length,
      organicResults,
      targetRank,
      topCompetitors,
    };
  } catch (error) {
    console.error("[SERP] Fetch failed:", error);
    return emptyResult(keyword);
  }
}
