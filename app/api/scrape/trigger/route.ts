import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runAiScraper } from "@/lib/server/brightdata-scraper";
import { createJob, resolveJob, failJob } from "@/lib/server/job-store";
import { checkAndRecordRun } from "@/lib/server/rate-limit";

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

    createJob(jobId);

    console.log(`[trigger] Job created jobId=${jobId} provider=${parsed.provider} prompt="${parsed.prompt.slice(0, 80)}..."`);

    // Fire and forget — do NOT await
    runAiScraper(parsed)
      .then((result) => {
        console.log(`[trigger] Job resolved jobId=${jobId} provider=${parsed.provider} answer.length=${result.answer.length} sources=${result.sources.length}`);
        resolveJob(jobId, result);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error(`[trigger] Job FAILED jobId=${jobId} provider=${parsed.provider} error="${message}"`);
        failJob(jobId, message);
      });

    return NextResponse.json({ jobId, status: "pending" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
