import { supabase } from './supabase'

type RateLimitResult =
  | { allowed: true }
  | { allowed: false; reason: string }

export async function checkAndRecordRun(
  ip: string,
  provider: string,
  prompt: string,
  userAgent: string
): Promise<RateLimitResult> {
  // Upsert the user row — create on first visit, update last_seen + total_runs on repeat
  const { error: upsertError } = await supabase.from('demo_users').upsert(
    {
      ip,
      user_agent: userAgent,
      last_seen: new Date().toISOString(),
    },
    {
      onConflict: 'ip',
      ignoreDuplicates: false,
    }
  )

  if (upsertError) {
    console.error('[rate-limit] demo_users upsert failed:', upsertError.message)
    // Fail open — don't block the user if tracking breaks
    return { allowed: true }
  }

  // Increment total_runs (best-effort, non-critical)
  try {
    await supabase.rpc('increment_total_runs', { user_ip: ip })
  } catch {
    // Ignore if RPC doesn't exist
  }

  // Attempt to insert the (ip, provider) run — UNIQUE constraint enforces the limit
  const { error: insertError } = await supabase.from('demo_runs').insert({
    ip,
    provider,
    prompt,
  })

  if (!insertError) {
    return { allowed: true }
  }

  // Postgres unique_violation code = '23505'
  if (insertError.code === '23505') {
    return { allowed: false, reason: `Rate limit reached for provider: ${provider}` }
  }

  // Any other DB error — fail open
  console.error('[rate-limit] demo_runs insert failed:', insertError.message)
  return { allowed: true }
}
