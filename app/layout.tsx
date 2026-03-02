import type { Metadata } from "next";
import { DM_Sans, Inter, JetBrains_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: "GEO/AEO Tracker — Powered by Bright Data",
  description: "AI brand visibility intelligence dashboard with local-first persistence",
};

/** Apply dark theme before first paint — prevents flash */
const themeScript = `(function(){try{var t=localStorage.getItem('sovereign-theme');if(t==='light'){document.documentElement.classList.add('light')}else{/* default to dark */document.documentElement.classList.remove('light')}}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-SDGRVMER2G" />
        {/* Google Remarketing */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=AW-879571748" />
        <script dangerouslySetInnerHTML={{ __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-SDGRVMER2G');
          gtag('config', 'AW-879571748');
        `}} />
      </head>
      <body
        suppressHydrationWarning
        className={`${dmSans.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
