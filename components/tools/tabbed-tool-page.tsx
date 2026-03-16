"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import Link from "next/link";
import type { Dictionary, Locale } from "@/lib/i18n/types";
import CheckToolClient from "./check-tool-client";

const AuditToolClient = lazy(() => import("./audit-tool-client"));
const BrandToolClient = lazy(() => import("./brand-tool-client"));

type TabKey = "check" | "audit" | "brand";

interface TabbedToolPageProps {
  locale: Locale;
  dict: Dictionary;
}

function TabSpinner() {
  return (
    <div className="bd-card p-8 flex justify-center">
      <div className="relative w-10 h-10">
        <div
          className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "var(--border-default)", borderTopColor: "var(--accent-primary)" }}
        />
      </div>
    </div>
  );
}

export function TabbedToolPage({ locale, dict }: TabbedToolPageProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("check");

  // Sync tab from URL hash on mount + popstate
  useEffect(() => {
    const readHash = () => {
      const hash = window.location.hash.replace("#", "") as TabKey;
      if (hash === "check" || hash === "audit" || hash === "brand") {
        setActiveTab(hash);
      }
    };
    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, []);

  const switchTab = (tab: TabKey) => {
    setActiveTab(tab);
    window.history.replaceState(null, "", `#${tab}`);
  };

  const NAV_ITEMS: { label: string; key: TabKey }[] = [
    { label: dict.nav.check, key: "check" },
    { label: dict.nav.audit, key: "audit" },
    { label: dict.nav.brand, key: "brand" },
  ];

  const heroContent = dict.hero[activeTab];
  const altLocale = locale === "en" ? "zh" : "en";
  const altHref = locale === "en" ? "/zh" : "/";
  const altLabel = locale === "en" ? "中文" : "EN";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      {/* Nav Bar */}
      <nav
        className="sticky top-0 z-50 border-b"
        style={{
          borderColor: "var(--border-default)",
          background: "rgba(7, 11, 20, 0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href={locale === "en" ? "/" : `/${locale}`} className="flex items-center gap-2 shrink-0">
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {dict.nav.siteName}
            </span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => switchTab(item.key)}
                className={`px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                  item.key === activeTab
                    ? "text-[var(--text-primary)]"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                }`}
                style={item.key === activeTab ? { background: "var(--th-accent-soft)" } : undefined}
              >
                {item.label}
              </button>
            ))}
            {/* Language switcher */}
            <Link
              href={altHref}
              className="ml-2 px-2 py-1 rounded text-xs font-medium border transition-colors"
              style={{
                borderColor: "var(--border-default)",
                color: "var(--text-tertiary)",
              }}
              hrefLang={altLocale}
            >
              {altLabel}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative py-12 sm:py-16 text-center px-4 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "var(--gradient-ambient)" }}
        />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3"
            style={{
              background: "var(--gradient-primary)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {heroContent.title}
          </h1>
          <p className="text-base sm:text-lg" style={{ color: "var(--text-secondary)" }}>
            {heroContent.subtitle}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        {activeTab === "check" && <CheckToolClient dict={dict.check} />}
        {activeTab === "audit" && (
          <Suspense fallback={<TabSpinner />}>
            <AuditToolClient dict={dict.audit} />
          </Suspense>
        )}
        {activeTab === "brand" && (
          <Suspense fallback={<TabSpinner />}>
            <BrandToolClient dict={dict.brand} />
          </Suspense>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-8 px-4" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs" style={{ color: "var(--text-tertiary)" }}>
          <span>&copy; {new Date().getFullYear()} {dict.footer.copyright}</span>
          <div className="flex items-center gap-4">
            <button onClick={() => switchTab("check")} className="hover:text-[var(--text-secondary)] transition-colors">
              {dict.nav.check}
            </button>
            <button onClick={() => switchTab("audit")} className="hover:text-[var(--text-secondary)] transition-colors">
              {dict.nav.audit}
            </button>
            <button onClick={() => switchTab("brand")} className="hover:text-[var(--text-secondary)] transition-colors">
              {dict.nav.brand}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
