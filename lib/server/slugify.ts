/**
 * Convert a user prompt into a URL-safe slug.
 * Lowercase, trim, replace non-alphanumeric with hyphens, collapse runs, max 80 chars.
 */
export function queryToSlug(prompt: string): string {
  return prompt
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

/**
 * Convert a URL into a domain-based slug.
 * Extracts hostname, removes www., replaces dots with hyphens.
 */
export function domainToSlug(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname
      .replace(/^www\./, "")
      .replace(/\./g, "-");
  } catch {
    // If URL parsing fails, treat the whole string as-is
    return url
      .toLowerCase()
      .trim()
      .replace(/^www\./, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80);
  }
}
