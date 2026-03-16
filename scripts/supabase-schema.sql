-- GEO/AEO Tracker — Phase 1: Data Persistence Tables
-- Run this in Supabase SQL Editor

-- Store AI scrape results for pSEO pages
CREATE TABLE IF NOT EXISTS scrape_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL,
  prompt TEXT NOT NULL,
  query_slug TEXT NOT NULL,
  answer TEXT NOT NULL,
  sources JSONB NOT NULL DEFAULT '[]',
  visibility_score INTEGER,
  sentiment TEXT,
  brand_mentions JSONB DEFAULT '[]',
  competitor_mentions JSONB DEFAULT '[]',
  ip TEXT,
  run_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_scrape_query_slug ON scrape_results(query_slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_scrape_dedup ON scrape_results(provider, query_slug, run_date);

-- Store AEO audit results
CREATE TABLE IF NOT EXISTS audit_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  domain_slug TEXT NOT NULL,
  score INTEGER NOT NULL,
  checks JSONB NOT NULL,
  ip TEXT,
  run_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_domain ON audit_results(domain_slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_audit_dedup ON audit_results(domain_slug, run_date);

-- Public tool rate limiting (3 uses/day/IP/tool)
CREATE TABLE IF NOT EXISTS public_tool_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip TEXT NOT NULL,
  tool TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tool_usage ON public_tool_usage(ip, tool, created_at);
