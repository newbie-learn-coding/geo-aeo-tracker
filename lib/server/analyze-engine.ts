export type AnalyzeRunResult = {
  visibilityScore: number;
  sentiment: "positive" | "neutral" | "negative" | "not-mentioned";
  brandMentioned: boolean;
  brandMentions: string[];
  competitorMentions: string[];
};

const JSON_SCHEMA = {
  type: "object",
  properties: {
    visibilityScore: {
      type: "number",
      description: "0-100 score of how visibly and positively the brand is featured in this AI response",
    },
    sentiment: {
      type: "string",
      enum: ["positive", "neutral", "negative", "not-mentioned"],
      description: "Sentiment of the response toward the brand",
    },
    brandMentioned: {
      type: "boolean",
      description: "Whether the brand (or any of its aliases) is explicitly mentioned",
    },
    brandMentions: {
      type: "array",
      items: { type: "string" },
      description: "Exact substrings from the response text where the brand appears",
    },
    competitorMentions: {
      type: "array",
      items: { type: "string" },
      description: "Competitor names that appear in the response",
    },
  },
  required: ["visibilityScore", "sentiment", "brandMentioned", "brandMentions", "competitorMentions"],
  additionalProperties: false,
};

/**
 * Analyze brand visibility in an AI-generated response using OpenRouter LLM inference.
 * Throws on errors (caller should catch).
 */
export async function analyzeBrandVisibility(params: {
  answer: string;
  brandName: string;
  brandAliases?: string;
  brandWebsite?: string;
  competitors?: string;
}): Promise<AnalyzeRunResult> {
  const key = process.env.OPENROUTER_KEY;
  if (!key) {
    throw new Error("Missing OPENROUTER_KEY");
  }

  const brandAliases = params.brandAliases
    ? params.brandAliases.split(",").map((a) => a.trim()).filter(Boolean)
    : [];
  const allBrandNames = [params.brandName, ...brandAliases].filter(Boolean);
  const competitors = params.competitors
    ? params.competitors.split(",").map((c) => c.trim()).filter(Boolean)
    : [];

  const systemPrompt = `You are a brand visibility analyst. Analyze the following AI-generated response text and extract structured brand visibility data.

Brand to track: ${allBrandNames.join(", ")}
${params.brandWebsite ? `Brand website: ${params.brandWebsite}` : ""}
${competitors.length > 0 ? `Competitors to track: ${competitors.join(", ")}` : ""}

Instructions:
- brandMentioned: true only if the brand name or one of its aliases clearly refers to the brand (not a generic word). E.g. "Monday" alone is NOT a mention of "monday.com" unless context makes it clear.
- brandMentions: list the exact verbatim phrases where the brand appears in the text
- competitorMentions: list competitor names that appear in the text
- sentiment: your judgment of how the response treats the brand — positive (recommended/praised), neutral (mentioned factually), negative (criticized/discouraged), not-mentioned (brand absent)
- visibilityScore (0-100):
  - 0 if not mentioned
  - 30 base if mentioned
  - +20 if mentioned in first 200 characters (prominent placement)
  - +10 if mentioned 3+ times
  - +5 if mentioned 2 times
  - +20 if listed as a top recommendation or explicitly recommended
  - +15 if sentiment is positive
  - +5 if sentiment is neutral
  - cap at 100`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze this AI response:\n\n${params.answer.slice(0, 6000)}` },
      ],
      max_tokens: 512,
      temperature: 0.1,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "brand_visibility_analysis",
          strict: true,
          schema: JSON_SCHEMA,
        },
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`[analyze-engine] OpenRouter failed (${response.status}): ${text}`);
    throw new Error(`OpenRouter request failed (${response.status}): ${text}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const raw = payload.choices?.[0]?.message?.content ?? "";
  const result = JSON.parse(raw) as AnalyzeRunResult;

  console.log(`[analyze-engine] brand=${params.brandName} score=${result.visibilityScore} sentiment=${result.sentiment} mentioned=${result.brandMentioned}`);

  return result;
}
