import type { Metadata } from "next";
import "./globals.css";
import { localizedSiteConfig, siteConfig } from "@/config/site";
import { AnalyticsProvider } from "@/lib/AnalyticsProvider";
import { getDeploymentDefaultLocale } from "@/lib/deployment-locale";
import { LocaleProvider } from "@/lib/LocaleProvider";
import { MotionProvider } from "@/lib/MotionProvider";
import { getHtmlLang } from "@/lib/locale";
import { WebVitals } from "@/lib/performance";
import { SkipToContent } from "@/components/SkipToContent";

const defaultLocale = getDeploymentDefaultLocale();
const localeConfig = localizedSiteConfig[defaultLocale];

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    template: `%s | ${siteConfig.siteName}`,
    default: siteConfig.siteName,
  },
  description: localeConfig.description,
  keywords: [...localeConfig.keywords],
  authors: [{ name: localeConfig.name }],
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang={getHtmlLang(defaultLocale)} suppressHydrationWarning>
      <body className="subpixel-antialiased" suppressHydrationWarning>
        <AnalyticsProvider>
          <MotionProvider>
            <LocaleProvider defaultLocale={defaultLocale}>
              <WebVitals />
              <SkipToContent />
              <div id="main-content">{children}</div>
              {modal}
            </LocaleProvider>
          </MotionProvider>
        </AnalyticsProvider>
      </body>
    </html>
  );
}
