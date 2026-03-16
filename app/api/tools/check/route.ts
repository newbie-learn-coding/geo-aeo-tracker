import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runAiScraper } from "@/lib/server/brightdata-scraper";
import { checkPublicToolLimit } from "@/lib/server/public-rate-limit";
import { saveScrapeToDB, getRecentScrapeBySlug } from "@/lib/server/db";
import { queryToSlug } from "@/lib/server/slugify";
import { ALL_PROVIDERS } from "@/components/dashboard/types";

export const maxDuration = 300;

const bodySchema = z.object({
  query: z.string().min(3).max(500),
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

    const { query } = parsed.data;

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "0.0.0.0";

    const rateCheck = await checkPublicToolLimit(ip, "check");
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Daily limit reached (3/day). Try again tomorrow.", rateLimited: true },
        { status: 429 },
      );
    }

    const slug = queryToSlug(query);

    // Check cache first
    const cached = await getRecentScrapeBySlug(slug);
    if (cached) {
      return NextResponse.json({
        query,
        slug,
        results: cached,
        cached: true,
      });
    }

    // Run all providers in parallel
    const settled = await Promise.allSettled(
      ALL_PROVIDERS.map((provider) =>
        runAiScraper({ provider, prompt: query }),
      ),
    );

    const results = settled.map((outcome, i) => {
      const provider = ALL_PROVIDERS[i];
      if (outcome.status === "fulfilled") {
        // Fire-and-forget DB save
        saveScrapeToDB({
          provider,
          prompt: query,
          answer: outcome.value.answer,
          sources: outcome.value.sources,
          ip,
        }).catch(() => {});

        return {
          provider,
          answer: outcome.value.answer,
          sources: outcome.value.sources,
        };
      }

      return {
        provider,
        answer: "",
        sources: [] as string[],
        error:
          outcome.reason instanceof Error
            ? outcome.reason.message
            : "Provider failed",
      };
    });

    return NextResponse.json({
      query,
      slug,
      results,
      cached: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[tools/check] Error: ${message}`);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
