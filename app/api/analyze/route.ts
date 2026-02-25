import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "edge";

const bodySchema = z.object({
  prompt: z.string().min(5),
  maxTokens: z.number().int().min(128).max(8192).optional(),
  temperature: z.number().min(0).max(1.5).optional(),
  skipCache: z.boolean().optional(),
  schema: z
    .object({
      name: z.string(),
      schema: z.record(z.string(), z.unknown()),
    })
    .optional(),
});

const cache = new Map<string, { expiresAt: number; text: string }>();

export async function POST(req: NextRequest) {
  try {
    const parsed = bodySchema.parse(await req.json());
    const cacheKey = JSON.stringify({ prompt: parsed.prompt, maxTokens: parsed.maxTokens, temperature: parsed.temperature });

    if (!parsed.skipCache) {
      const hit = cache.get(cacheKey);
      if (hit && hit.expiresAt > Date.now()) {
        return NextResponse.json({ text: hit.text, cached: true });
      }
    } else {
      cache.delete(cacheKey);
    }

    const key = process.env.OPENROUTER_KEY;
    if (!key) {
      return NextResponse.json(
        { error: "Missing OPENROUTER_KEY" },
        { status: 400 },
      );
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "user",
            content: parsed.prompt,
          },
        ],
        max_tokens: parsed.maxTokens ?? 900,
        temperature: parsed.temperature ?? 0.2,
        ...(parsed.schema && {
          response_format: {
            type: "json_schema",
            json_schema: {
              name: parsed.schema.name,
              strict: true,
              schema: parsed.schema.schema,
            },
          },
        }),
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: `OpenRouter request failed (${response.status}): ${text}` },
        { status: 500 },
      );
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const text = payload.choices?.[0]?.message?.content ?? "";
    cache.set(cacheKey, {
      text,
      expiresAt: Date.now() + 1000 * 60 * 30,
    });

    return NextResponse.json({ text, cached: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
