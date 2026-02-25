import { z } from "zod";

const ProviderSchema = z.enum([
  "chatgpt",
  "perplexity",
  "copilot",
  "gemini",
  "google_ai",
  "grok",
]);

type Provider = z.infer<typeof ProviderSchema>;

const OUTPUT_CACHE_TTL_MS = 1000 * 60 * 20;

const inMemoryCache = new Map<
  string,
  { expiresAt: number; value: NormalizedScrapeResult }
>();

const providerToDatasetEnv: Record<Provider, string> = {
  chatgpt: "BRIGHT_DATA_DATASET_CHATGPT",
  perplexity: "BRIGHT_DATA_DATASET_PERPLEXITY",
  copilot: "BRIGHT_DATA_DATASET_COPILOT",
  gemini: "BRIGHT_DATA_DATASET_GEMINI",
  google_ai: "BRIGHT_DATA_DATASET_GOOGLE_AI",
  grok: "BRIGHT_DATA_DATASET_GROK",
};

const providerBaseUrl: Record<Provider, string> = {
  chatgpt: "https://chatgpt.com/",
  perplexity: "https://www.perplexity.ai/",
  copilot: "https://copilot.microsoft.com/",
  gemini: "https://gemini.google.com/",
  google_ai: "https://www.google.com/",
  grok: "https://grok.com/",
};

export type ScrapeRequest = {
  provider: Provider;
  prompt: string;
  requireSources?: boolean;
  country?: string;
};

export type NormalizedScrapeResult = {
  provider: Provider;
  prompt: string;
  answer: string;
  sources: string[];
  snapshotId?: string;
  cached: boolean;
  raw: unknown;
  createdAt: string;
};

function getApiKey() {
  return process.env.BRIGHT_DATA_KEY;
}

function getDatasetId(provider: Provider) {
  return process.env[providerToDatasetEnv[provider]];
}

function buildCacheKey(input: ScrapeRequest) {
  return JSON.stringify(input);
}

function withAuthHeaders() {
  const key = getApiKey();
  if (!key) {
    throw new Error("Missing BRIGHT_DATA_KEY");
  }

  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

function stripAnswerHtml(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => stripAnswerHtml(entry));
  }

  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const cleaned: Record<string, unknown> = {};

    for (const [key, entry] of Object.entries(obj)) {
      if (key.toLowerCase() === "answer_html") {
        continue;
      }
      cleaned[key] = stripAnswerHtml(entry);
    }

    return cleaned;
  }

  return value;
}

function extractSourcesFromAnswer(answer: string) {
  const found = new Set<string>();

  const blockedHostFragments = [
    // AI platforms
    "chatgpt.com",
    "openai.com",
    "oaiusercontent.com",
    "perplexity.ai",
    "pplx.ai",
    "copilot.microsoft.com",
    "grok.com",
    "x.ai",
    "gemini.google.com",
    "bard.google.com",
    "google.com/ai",
    // CDN / asset hosts
    "cloudfront.net",
    "cdn.prod.website-files.com",
    "cdn.jsdelivr.net",
    "cdnjs.cloudflare.com",
    "unpkg.com",
    "fastly.net",
    "akamaihd.net",
    "cloudflare.com",
    "amazonaws.com",
    // Tracking / analytics / pixels
    "connect.facebook.net",
    "facebook.net",
    "google-analytics.com",
    "googletagmanager.com",
    "doubleclick.net",
    "googlesyndication.com",
    "googleadservices.com",
    "hotjar.com",
    "segment.io",
    "segment.com",
    "mixpanel.com",
    "amplitude.com",
    "sentry.io",
    // Namespace / spec URIs
    "w3.org",
    "schema.org",
    "xmlns.com",
  ];

  const assetPathPattern = /\.(js|css|map|png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|eot|mp4|webm|mp3)(\?|$)/i;

  const junkPathFragments = [
    "/signals/",
    "/pixel",
    "/tracking",
    "/beacon",
    "/analytics",
    "/__",
    "/wp-content/uploads/",
    "/wp-includes/",
  ];

  const isThirdPartyCitation = (urlValue: string) => {
    try {
      const parsed = new URL(urlValue);
      const host = parsed.hostname.toLowerCase();
      const full = `${host}${parsed.pathname}`.toLowerCase();

      if (!(parsed.protocol === "http:" || parsed.protocol === "https:")) {
        return false;
      }

      if (blockedHostFragments.some((entry) => host === entry || host.endsWith(`.${entry}`))) {
        return false;
      }

      if (assetPathPattern.test(parsed.pathname)) {
        return false;
      }

      if (junkPathFragments.some((frag) => full.includes(frag))) {
        return false;
      }

      if (
        parsed.pathname.includes("/_spa/") ||
        parsed.pathname.includes("/assets/") ||
        full.includes("static")
      ) {
        return false;
      }

      // Reject overly long query strings (tracking params, base64 images, etc.)
      if (parsed.search.length > 200) {
        return false;
      }

      // Reject data URIs or blob-like things that somehow parsed
      if (host === "" || host === "localhost") {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  };

  const normalize = (urlValue: string) => {
    try {
      const parsed = new URL(urlValue);
      parsed.hash = "";
      return parsed.toString();
    } catch {
      return urlValue;
    }
  };

  const plainUrls = answer.match(/https?:\/\/[^\s)\]}"']+/g) ?? [];
  plainUrls
    .map((entry) => entry.replace(/[),.;:!?]+$/, ""))
    .filter(isThirdPartyCitation)
    .map(normalize)
    .forEach((entry) => found.add(entry));

  const markdownLinks = answer.match(/\[[^\]]+\]\((https?:\/\/[^)]+)\)/g) ?? [];
  markdownLinks.forEach((entry) => {
    const urlMatch = entry.match(/\((https?:\/\/[^)]+)\)/);
    if (!urlMatch?.[1]) return;
    const candidate = urlMatch[1].replace(/[),.;:!?]+$/, "");
    if (isThirdPartyCitation(candidate)) {
      found.add(normalize(candidate));
    }
  });

  return [...found];
}

function normalizeAnswer(rawRecord: Record<string, unknown>) {
  const answerCandidates = [
    rawRecord.answer_text,           // Bright Data primary field
    rawRecord.answer_text_markdown,  // Markdown variant (Perplexity, Grok, Copilot)
    rawRecord.answer,                // Legacy / fallback
    rawRecord.response_raw,          // Grok raw response
    rawRecord.response,
    rawRecord.output,
    rawRecord.result,
    rawRecord.text,
    rawRecord.content,
  ];

  for (const item of answerCandidates) {
    if (typeof item === "string" && item.trim()) {
      return item.trim();
    }
  }

  // Deep extraction: look inside nested objects/arrays for text content
  function extractDeepText(obj: unknown, depth: number): string | null {
    if (depth > 3) return null;
    if (typeof obj === "string" && obj.trim().length > 20) return obj.trim();
    if (Array.isArray(obj)) {
      for (const entry of obj) {
        const found = extractDeepText(entry, depth + 1);
        if (found) return found;
      }
    }
    if (obj && typeof obj === "object") {
      const record = obj as Record<string, unknown>;
      // Check common text field names
      for (const key of ["answer_text", "answer_text_markdown", "answer", "response_raw", "response", "output", "result", "text", "content", "message", "body", "summary", "description"]) {
        if (typeof record[key] === "string" && (record[key] as string).trim().length > 20) {
          return (record[key] as string).trim();
        }
      }
      // Recurse into any value
      for (const val of Object.values(record)) {
        const found = extractDeepText(val, depth + 1);
        if (found) return found;
      }
    }
    return null;
  }

  const deepText = extractDeepText(rawRecord, 0);
  if (deepText) return deepText;

  // Last resort: stringify but strip obvious noise
  const raw = JSON.stringify(rawRecord);
  // If it's tiny JSON, just return it — user will see something
  if (raw.length < 500) return raw;
  // For large blobs, try to extract readable text by stripping JSON structure
  return raw
    .replace(/[{}\[\]"]/g, " ")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 2000);
}

async function monitorUntilReady(snapshotId: string) {
  const maxAttempts = 30;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const monitorRes = await fetch(
      `https://api.brightdata.com/datasets/v3/progress/${snapshotId}`,
      {
        method: "GET",
        headers: withAuthHeaders(),
      },
    );

    if (!monitorRes.ok) {
      const body = await monitorRes.text().catch(() => "(unreadable)");
      console.error(`[BD] monitorUntilReady: HTTP ${monitorRes.status} for snapshot ${snapshotId}. Body: ${body}`);
      throw new Error(`Monitor failed (${monitorRes.status})`);
    }

    const monitorJson = (await monitorRes.json()) as {
      status: "starting" | "running" | "ready" | "failed";
    };

    console.log(`[BD] monitorUntilReady: attempt ${attempt + 1}/${maxAttempts}, snapshot=${snapshotId}, status=${monitorJson.status}`);

    if (monitorJson.status === "ready") {
      return;
    }

    if (monitorJson.status === "failed") {
      console.error(`[BD] monitorUntilReady: snapshot ${snapshotId} reported failed`);
      throw new Error("Snapshot failed");
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.error(`[BD] monitorUntilReady: timed out after ${maxAttempts} attempts for snapshot ${snapshotId}`);
  throw new Error("Timed out while waiting for snapshot readiness");
}

async function downloadSnapshot(snapshotId: string) {
  const response = await fetch(
    `https://api.brightdata.com/datasets/v3/snapshot/${snapshotId}?format=json`,
    {
      method: "GET",
      headers: withAuthHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error(`Download failed (${response.status})`);
  }

  return response.json();
}

export async function runAiScraper(
  request: ScrapeRequest,
): Promise<NormalizedScrapeResult> {
  const parsed = ProviderSchema.parse(request.provider);
  const datasetId = getDatasetId(parsed);

  console.log(`[BD] runAiScraper: START provider=${parsed} prompt="${request.prompt.slice(0, 80)}..."`);

  if (!datasetId) {
    console.error(`[BD] runAiScraper: MISSING dataset id for provider=${parsed}. Expected env var: ${providerToDatasetEnv[parsed]}`);
    throw new Error(
      `Missing dataset id for provider ${parsed}. Expected env: ${providerToDatasetEnv[parsed]}`,
    );
  }

  const cacheKey = buildCacheKey(request);
  const cacheHit = inMemoryCache.get(cacheKey);
  if (cacheHit && cacheHit.expiresAt > Date.now()) {
    console.log(`[BD] runAiScraper: CACHE HIT provider=${parsed}`);
    return {
      ...cacheHit.value,
      cached: true,
    };
  }

  const inputRecord: Record<string, unknown> = {
    url: providerBaseUrl[parsed],
    prompt: request.prompt,
    index: 1,
  };

  if (request.country) {
    inputRecord.geolocation = request.country;
  }

  console.log(`[BD] runAiScraper: Triggering scrape for provider=${parsed}, datasetId=${datasetId}`);

  const scrapeResponse = await fetch(
    `https://api.brightdata.com/datasets/v3/scrape?dataset_id=${datasetId}&notify=false&include_errors=true&format=json`,
    {
      method: "POST",
      headers: withAuthHeaders(),
      body: JSON.stringify({ input: [inputRecord] }),
    },
  );

  console.log(`[BD] runAiScraper: Scrape trigger response status=${scrapeResponse.status} provider=${parsed}`);

  let payload: unknown;

  if (scrapeResponse.status === 202) {
    const pending = (await scrapeResponse.json()) as {
      snapshot_id: string;
    };
    console.log(`[BD] runAiScraper: Async job, snapshot_id=${pending.snapshot_id}, polling...`);
    await monitorUntilReady(pending.snapshot_id);
    console.log(`[BD] runAiScraper: Snapshot ready, downloading snapshot_id=${pending.snapshot_id}`);
    payload = await downloadSnapshot(pending.snapshot_id);
  } else {
    if (!scrapeResponse.ok) {
      const text = await scrapeResponse.text();
      console.error(`[BD] runAiScraper: Scrape trigger FAILED provider=${parsed} status=${scrapeResponse.status} body=${text}`);
      throw new Error(`Scrape failed (${scrapeResponse.status}): ${text}`);
    }
    payload = await scrapeResponse.json();
  }

  console.log(`[BD] runAiScraper: Raw payload received for provider=${parsed}, type=${Array.isArray(payload) ? "array" : typeof payload}, length=${Array.isArray(payload) ? (payload as unknown[]).length : "n/a"}`);

  // Keep unsanitized first record for structured source extraction
  const rawFirst = Array.isArray(payload)
    ? (payload as Record<string, unknown>[])[0]
    : (payload as Record<string, unknown>);
  const rawRecord = (rawFirst ?? {}) as Record<string, unknown>;

  // Log raw top-level keys to help diagnose field mapping issues
  console.log(`[BD] runAiScraper: Raw record top-level keys for provider=${parsed}: [${Object.keys(rawRecord).join(", ")}]`);

  const sanitizedPayload = stripAnswerHtml(payload);
  const sanitizedFirst = Array.isArray(sanitizedPayload)
    ? sanitizedPayload[0]
    : (sanitizedPayload as Record<string, unknown>);
  const record = (sanitizedFirst ?? {}) as Record<string, unknown>;
  const answer = normalizeAnswer(record);

  if (!answer || answer.length < 10) {
    console.warn(`[BD] runAiScraper: EMPTY or SHORT answer extracted for provider=${parsed}. answer="${answer}". Raw keys: [${Object.keys(rawRecord).join(", ")}]. Snippet: ${JSON.stringify(rawRecord).slice(0, 300)}`);
  } else {
    console.log(`[BD] runAiScraper: Answer extracted for provider=${parsed}, length=${answer.length}`);
  }

  // Extract sources from answer text
  const textSources = extractSourcesFromAnswer(answer);

  // Also extract from Bright Data's structured citation fields
  const structuredSources: string[] = [];
  for (const field of ["citations", "links_attached", "sources"]) {
    const arr = rawRecord[field];
    if (Array.isArray(arr)) {
      for (const item of arr) {
        if (typeof item === "string" && item.startsWith("http")) {
          structuredSources.push(item);
        } else if (item && typeof item === "object") {
          const url = (item as Record<string, unknown>).url;
          if (typeof url === "string" && url.startsWith("http")) {
            structuredSources.push(url);
          }
        }
      }
    }
  }

  // Merge and deduplicate
  const allSources = [...new Set([...textSources, ...structuredSources])];
  console.log(`[BD] runAiScraper: Sources extracted for provider=${parsed}: textSources=${textSources.length}, structuredSources=${structuredSources.length}, total=${allSources.length}`);

  const normalized: NormalizedScrapeResult = {
    provider: parsed,
    prompt: request.prompt,
    answer,
    sources: allSources,
    snapshotId:
      typeof record.snapshot_id === "string" ? record.snapshot_id : undefined,
    cached: false,
    raw: sanitizedPayload,
    createdAt: new Date().toISOString(),
  };

  inMemoryCache.set(cacheKey, {
    expiresAt: Date.now() + OUTPUT_CACHE_TTL_MS,
    value: normalized,
  });

  console.log(`[BD] runAiScraper: SUCCESS provider=${parsed}, answer.length=${answer.length}, sources=${allSources.length}`);
  return normalized;
}
