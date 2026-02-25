import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runAiScraper } from "@/lib/server/brightdata-scraper";
import { createJob, resolveJob, failJob } from "@/lib/server/job-store";

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
    const jobId = crypto.randomUUID();

    createJob(jobId);

    // Fire and forget — do NOT await
    runAiScraper(parsed)
      .then((result) => resolveJob(jobId, result))
      .catch((err: unknown) =>
        failJob(jobId, err instanceof Error ? err.message : "Unknown error"),
      );

    return NextResponse.json({ jobId, status: "pending" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
