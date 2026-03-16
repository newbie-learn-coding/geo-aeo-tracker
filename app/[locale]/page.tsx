import type { Metadata } from "next";
import { getDictionary, LOCALES } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";
import { JsonLd } from "@/components/json-ld";
import { TabbedToolPage } from "@/components/tools/tabbed-tool-page";

const BASE = "https://aitracking.io";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = (rawLocale === "zh" ? "zh" : "en") as Locale;
  const dict = getDictionary(locale);
  const url = locale === "en" ? BASE : `${BASE}/${locale}`;

  return {
    title: dict.meta.title,
    description: dict.meta.description,
    openGraph: {
      title: dict.meta.ogTitle,
      description: dict.meta.ogDescription,
      siteName: "AI Tracking",
      type: "website",
      url,
    },
    twitter: {
      card: "summary_large_image",
      title: dict.meta.ogTitle,
      description: dict.meta.ogDescription,
    },
    alternates: {
      canonical: url,
      languages: {
        en: BASE,
        zh: `${BASE}/zh`,
        "x-default": BASE,
      },
    },
  };
}

export default async function LocalePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = (rawLocale === "zh" ? "zh" : "en") as Locale;
  const dict = getDictionary(locale);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "AI Tracking",
          url: BASE,
          description: dict.meta.description,
          applicationCategory: "SEO Tool",
          inLanguage: locale,
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
          hasPart: [
            {
              "@type": "WebApplication",
              name: dict.nav.check,
              url: locale === "en" ? `${BASE}/#check` : `${BASE}/zh#check`,
              description: dict.meta.checkDescription,
            },
            {
              "@type": "WebApplication",
              name: dict.nav.audit,
              url: locale === "en" ? `${BASE}/#audit` : `${BASE}/zh#audit`,
              description: dict.meta.auditDescription,
            },
            {
              "@type": "WebApplication",
              name: dict.nav.brand,
              url: locale === "en" ? `${BASE}/#brand` : `${BASE}/zh#brand`,
              description: dict.meta.brandDescription,
            },
          ],
        }}
      />
      <TabbedToolPage locale={locale} dict={dict} />
    </>
  );
}
