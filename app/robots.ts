import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/zh"],
        disallow: ["/api/", "/demo"],
      },
    ],
    sitemap: "https://aitracking.io/sitemap.xml",
  };
}
