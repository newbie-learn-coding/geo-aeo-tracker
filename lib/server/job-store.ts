import type { NormalizedScrapeResult } from "./brightdata-scraper";

export type ScrapeJob = {
  jobId: string;
  status: "pending" | "ready" | "failed";
  result?: NormalizedScrapeResult;
  error?: string;
  createdAt: number;
};

const JOB_TTL_MS = 1000 * 60 * 60; // 1 hour

const jobs = new Map<string, ScrapeJob>();

function gc() {
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (now - job.createdAt > JOB_TTL_MS) jobs.delete(id);
  }
}

export function createJob(jobId: string): void {
  gc();
  jobs.set(jobId, { jobId, status: "pending", createdAt: Date.now() });
}

export function resolveJob(jobId: string, result: NormalizedScrapeResult): void {
  const job = jobs.get(jobId);
  if (job) jobs.set(jobId, { ...job, status: "ready", result });
}

export function failJob(jobId: string, error: string): void {
  const job = jobs.get(jobId);
  if (job) jobs.set(jobId, { ...job, status: "failed", error });
}

export function getJob(jobId: string): ScrapeJob | undefined {
  return jobs.get(jobId);
}
