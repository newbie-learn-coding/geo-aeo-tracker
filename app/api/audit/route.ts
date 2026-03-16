import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runFullAudit } from "@/lib/server/audit-engine";
import { saveAuditToDB } from "@/lib/server/db";

const bodySchema = z.object({
  url: z.string().url(),
});

export async function POST(req: NextRequest) {
  try {
    const { url } = bodySchema.parse(await req.json());
    const result = await runFullAudit(url);

    // Fire-and-forget DB save
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "0.0.0.0";
    saveAuditToDB({ url, score: result.score, checks: result.checks, ip }).catch(() => {});

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
