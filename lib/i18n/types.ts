export type Locale = "en" | "zh";

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALES: Locale[] = ["en", "zh"];

export interface Dictionary {
  nav: {
    siteName: string;
    check: string;
    audit: string;
    brand: string;
  };
  hero: {
    check: { title: string; subtitle: string };
    audit: { title: string; subtitle: string };
    brand: { title: string; subtitle: string };
  };
  check: {
    label: string;
    placeholder: string;
    submit: string;
    submitting: string;
    rateLimit: string;
    querying: string;
    sources: string;
    showMore: string;
    showLess: string;
  };
  audit: {
    label: string;
    placeholder: string;
    submit: string;
    submitting: string;
    rateLimit: string;
    loading: string;
    loadingDetail: string;
    scoreLabel: string;
    checksPassed: string;
    discovery: string;
    structure: string;
    content: string;
    technical: string;
    rendering: string;
  };
  brand: {
    label: string;
    brandPlaceholder: string;
    websitePlaceholder: string;
    competitorsPlaceholder: string;
    submit: string;
    submitting: string;
    rateLimit: string;
    loading: string;
    loadingDetail: string;
    scoreLabel: string;
    avgVisibility: string;
    sentiment: string;
    positive: string;
    neutral: string;
    negative: string;
    notMentioned: string;
    brandMentions: string;
    competitorMentions: string;
  };
  footer: {
    copyright: string;
  };
  meta: {
    title: string;
    description: string;
    ogTitle: string;
    ogDescription: string;
    checkTitle: string;
    checkDescription: string;
    auditTitle: string;
    auditDescription: string;
    brandTitle: string;
    brandDescription: string;
  };
  common: {
    error: string;
  };
}
