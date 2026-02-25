import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/geo-tracker",
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
};

export default nextConfig;
