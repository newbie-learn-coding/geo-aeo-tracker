import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runAiScraper } from "@/lib/server/brightdata-scraper";
import { analyzeBrandVisibility } from "@/lib/server/analyze-engine";
import { checkPublicToolLimit } from "@/lib/server/public-rate-limit";
import { saveScrapeToDB } from "@/lib/server/db";
import { ALL_PROVIDERS } from "@/components/dashboard/types";

export const maxDuration = 300;

const bodySchema = z.object({
  brandName: z.string().min(1).max(100),
  website: z.string().url().optional(),
  competitors: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { brandName, website, competitors } = parsed.data;

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "0.0.0.0";

    const rateCheck = await checkPublicToolLimit(ip, "brand");
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Daily limit reached (3/day). Try again tomorrow.", rateLimited: true },
        { status: 429 },
      );
    }

    // Single optimized prompt to reduce API calls (1 prompt x 6 providers = 6 calls)
    const prompt = `What is ${brandName} and what are the best alternatives?`;

    // Run all providers in parallel
    const settled = await Promise.allSettled(
      ALL_PROVIDERS.map((provider) =>
        runAiScraper({ provider, prompt }),
      ),
    );

    // Process results: analyze each successful scrape for brand visibility
    const results = await Promise.all(
      settled.map(async (outcome, i) => {
        const provider = ALL_PROVIDERS[i];

        if (outcome.status === "rejected") {
          return {
            provider,
            answer: "",
            sources: [] as string[],
            visibilityScore: 0,
            sentiment: "not-mentioned" as const,
            brandMentions: [] as string[],
            competitorMentions: [] as string[],
            error:
              outcome.reason instanceof Error
                ? outcome.reason.message
                : "Provider failed",
          };
        }

        const scrapeResult = outcome.value;

        // Fire-and-forget DB save
        saveScrapeToDB({
          provider,
          prompt,
          answer: scrapeResult.answer,
          sources: scrapeResult.sources,
          ip,
        }).catch(() => {});

        // Analyze brand visibility for this result
        try {
          const analysis = await analyzeBrandVisibility({
            answer: scrapeResult.answer,
            brandName,
            brandWebsite: website,
            competitors,
          });

          return {
            provider,
            answer: scrapeResult.answer,
            sources: scrapeResult.sources,
            visibilityScore: analysis.visibilityScore,
            sentiment: analysis.sentiment,
            brandMentions: analysis.brandMentions,
            competitorMentions: analysis.competitorMentions,
          };
        } catch {
          // If analysis fails, return scrape result without scoring
          return {
            provider,
            answer: scrapeResult.answer,
            sources: scrapeResult.sources,
            visibilityScore: 0,
            sentiment: "not-mentioned" as const,
            brandMentions: [] as string[],
            competitorMentions: [] as string[],
          };
        }
      }),
    );

    return NextResponse.json({
      brandName,
      prompt,
      results,
      cached: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[tools/brand] Error: ${message}`);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
