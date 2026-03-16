import { supabase } from "./supabase";

const MAX_USES_PER_DAY = 3;

export async function checkPublicToolLimit(
  ip: string,
  tool: string
): Promise<{ allowed: boolean }> {
  try {
    // Start of today in UTC
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    // Count usage rows for this IP + tool today
    const { count, error: countError } = await supabase
      .from("public_tool_usage")
      .select("*", { count: "exact", head: true })
      .eq("ip", ip)
      .eq("tool", tool)
      .gte("created_at", todayStart.toISOString());

    if (countError) {
      console.error("[public-rate-limit] count failed:", countError.message);
      return { allowed: true }; // fail-open
    }

    if ((count ?? 0) >= MAX_USES_PER_DAY) {
      return { allowed: false };
    }

    // Record this usage
    const { error: insertError } = await supabase
      .from("public_tool_usage")
      .insert({ ip, tool });

    if (insertError) {
      console.error("[public-rate-limit] insert failed:", insertError.message);
      // Still allow — the check passed, insert is best-effort
    }

    return { allowed: true };
  } catch (err) {
    console.error("[public-rate-limit] exception:", err);
    return { allowed: true }; // fail-open
  }
}
