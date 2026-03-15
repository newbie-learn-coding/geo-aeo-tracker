import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { analyzeSRO } from "@/lib/server/openrouter-sro";
import type {
  GroundingResult,
  PlatformResult,
  SerpResult,
  ScrapedPage,
  SiteContext,
} from "@/lib/server/sro-types";

const requestSchema = z.object({
  targetUrl: z.string().url(),
  keyword: z.string().min(1),
  grounding: z.any().nullable().optional(),
  platforms: z.array(z.any()).optional().default([]),
  serp: z.any().nullable().optional(),
  targetPage: z.any().nullable().optional(),
  competitorPages: z.array(z.any()).optional().default([]),
  siteContext: z.any().nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = requestSchema.parse(body);

    const result = await analyzeSRO({
      targetUrl: parsed.targetUrl,
      keyword: parsed.keyword,
      grounding: (parsed.grounding as GroundingResult) ?? null,
      platforms: (parsed.platforms as PlatformResult[]) ?? [],
      serp: (parsed.serp as SerpResult) ?? null,
      targetPage: (parsed.targetPage as ScrapedPage) ?? null,
      competitorPages: (parsed.competitorPages as ScrapedPage[]) ?? [],
      siteContext: (parsed.siteContext as SiteContext) ?? null,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
