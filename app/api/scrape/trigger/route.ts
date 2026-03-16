import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runAiScraper } from "@/lib/server/brightdata-scraper";
import { checkAndRecordRun } from "@/lib/server/rate-limit";
import { saveScrapeToDB } from "@/lib/server/db";

// Allow up to 5 minutes for the scraper to complete
export const maxDuration = 300;

const InputSchema = z.object({
  provider: z.enum([
    "chatgpt",
    "perplexity",
    "copilot",
    "gemini",
    "google_ai",
    "grok",
  ]),
  prompt: z.string().min(3),
  requireSources: z.boolean().optional(),
  country: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = InputSchema.parse(body);

    // Extract IP from request headers
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "0.0.0.0";
    const userAgent = req.headers.get("user-agent") ?? "";

    // Check rate limit before doing any work
    const rateLimit = await checkAndRecordRun(ip, parsed.provider, parsed.prompt, userAgent);
    if (!rateLimit.allowed) {
      console.log(`[trigger] Rate limited ip=${ip} provider=${parsed.provider}`);
      return NextResponse.json({ rateLimited: true }, { status: 429 });
    }

    const jobId = crypto.randomUUID();
    console.log(`[trigger] Job started jobId=${jobId} provider=${parsed.provider} prompt="${parsed.prompt.slice(0, 80)}..."`);

    // Await the scraper — returns result directly, no polling needed
    const result = await runAiScraper(parsed);

    console.log(`[trigger] Job done jobId=${jobId} provider=${parsed.provider} answer.length=${result.answer.length} sources=${result.sources.length}`);

    // Fire-and-forget DB save
    saveScrapeToDB({
      provider: parsed.provider,
      prompt: parsed.prompt,
      answer: result.answer,
      sources: result.sources,
      ip,
    }).catch(() => {});

    return NextResponse.json({ jobId, status: "ready", result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[trigger] Job FAILED error="${message}"`);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
