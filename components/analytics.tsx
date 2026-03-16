"use client";

export function Analytics() {
  return (
    <>
      <script async src="https://www.googletagmanager.com/gtag/js?id=G-SDGRVMER2G" />
      <script async src="https://www.googletagmanager.com/gtag/js?id=AW-879571748" />
      <script dangerouslySetInnerHTML={{ __html: `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-SDGRVMER2G');
        gtag('config', 'AW-879571748');
      `}} />
    </>
  );
}
