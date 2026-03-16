import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runFullAudit } from "@/lib/server/audit-engine";
import { checkPublicToolLimit } from "@/lib/server/public-rate-limit";
import { saveAuditToDB, getRecentAuditByDomain } from "@/lib/server/db";
import { domainToSlug } from "@/lib/server/slugify";

export const maxDuration = 300;

const bodySchema = z.object({
  url: z.string().url(),
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

    const { url } = parsed.data;

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "0.0.0.0";

    const rateCheck = await checkPublicToolLimit(ip, "audit");
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Daily limit reached (3/day). Try again tomorrow.", rateLimited: true },
        { status: 429 },
      );
    }

    const domainSlug = domainToSlug(url);

    // Check cache first
    const cached = await getRecentAuditByDomain(domainSlug);
    if (cached) {
      return NextResponse.json({
        ...cached,
        cached: true,
      });
    }

    // Run the full audit
    const result = await runFullAudit(url);

    // Fire-and-forget DB save
    saveAuditToDB({ url, score: result.score, checks: result.checks, ip }).catch(
      () => {},
    );

    return NextResponse.json({
      ...result,
      cached: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[tools/audit] Error: ${message}`);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
