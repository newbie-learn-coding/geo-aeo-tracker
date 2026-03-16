import { buildOgImage, ogSize, ogContentType } from "@/lib/og-template";

export const runtime = "edge";
export const size = ogSize;
export const contentType = ogContentType;

export default async function OgImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isZh = locale === "zh";

  return buildOgImage({
    title: isZh ? "AI Tracking — AI 可见度工具" : "AI Tracking",
    subtitle: isZh ? "免费 AI 可见度工具" : "AI Visibility Tools — Free & Open",
    pills: isZh
      ? ["AI 回答检查", "AEO 网站审计", "品牌可见度"]
      : ["AI Answer Checker", "AEO Site Audit", "Brand Visibility"],
  });
}
