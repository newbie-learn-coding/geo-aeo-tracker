import type { Metadata } from "next";
import { DM_Sans, Inter, JetBrains_Mono, Noto_Sans_SC } from "next/font/google";
import { headers } from "next/headers";
import { Analytics } from "@/components/analytics";
import { JsonLd } from "@/components/json-ld";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sc",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://aitracking.io"),
  title: "AI Tracking — AI Visibility Tools",
  description: "Free tools to check how AI models mention your brand. Compare responses from ChatGPT, Perplexity, Gemini, Copilot, Google AI, and Grok.",
  openGraph: {
    title: "AI Tracking — AI Visibility Tools",
    description: "Free tools to check how AI models mention your brand.",
    siteName: "AI Tracking",
    type: "website",
    url: "https://aitracking.io",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Tracking — AI Visibility Tools",
    description: "Free tools to check how AI models mention your brand.",
  },
};

/** Apply dark theme before first paint — prevents flash */
const themeScript = `(function(){try{var t=localStorage.getItem('sovereign-theme');if(t==='light'){document.documentElement.classList.add('light')}else{document.documentElement.classList.remove('light')}}catch(e){}})()`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const locale = headersList.get("x-locale") || "en";

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "AI Tracking",
            url: "https://aitracking.io",
            description: "Free tools to check how AI models mention your brand.",
            publisher: {
              "@type": "Organization",
              name: "AI Tracking",
              url: "https://aitracking.io",
            },
          }}
        />
        <Analytics />
      </head>
      <body
        suppressHydrationWarning
        className={`${dmSans.variable} ${inter.variable} ${jetbrainsMono.variable} ${notoSansSC.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
