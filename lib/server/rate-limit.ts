import { supabase } from './supabase'

const MAX_RUNS_PER_PROVIDER = 10
const ALLOWLISTED_IPS = ['130.41.220.17']

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

  if (ALLOWLISTED_IPS.includes(ip)) {
    return { allowed: true }
  }

  // Count how many runs this IP has already made for this provider
  const { count, error: countError } = await supabase
    .from('demo_runs')
    .select('*', { count: 'exact', head: true })
    .eq('ip', ip)
    .eq('provider', provider)

  if (countError) {
    console.error('[rate-limit] demo_runs count failed:', countError.message)
    // Fail open — don't block the user if counting breaks
    return { allowed: true }
  }

  if ((count ?? 0) >= MAX_RUNS_PER_PROVIDER) {
    return { allowed: false, reason: `Rate limit reached for provider: ${provider}` }
  }

  // Insert the run record
  const { error: insertError } = await supabase.from('demo_runs').insert({
    ip,
    provider,
    prompt,
  })

  if (insertError) {
    console.error('[rate-limit] demo_runs insert failed:', insertError.message)
  }

  return { allowed: true }
}
