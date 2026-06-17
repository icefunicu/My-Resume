import type { Metadata } from "next";
import { localizedSiteConfig, siteConfig } from "@/config/site";
import { getExperience } from "@/lib/experiences";
import {
  addLocalePrefix,
  getOpenGraphLocale,
  stripLocalePrefix,
  type Locale,
} from "@/lib/locale";
import {
  getDeploymentDefaultLocale,
  shouldUseExplicitRootLocale,
} from "@/lib/deployment-locale";
import { getPortfolioData } from "@/lib/portfolio-data";

function normalizePagePath(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

function buildRoutePath(
  locale: Locale,
  pathname: string,
  explicitLocale = false,
): string {
  const normalizedPath = stripLocalePrefix(normalizePagePath(pathname));
  if (explicitLocale) {
    return addLocalePrefix(normalizedPath, locale);
  }

  const defaultLocale = getDeploymentDefaultLocale();
  if (
    locale === defaultLocale &&
    !(normalizedPath === "/" && shouldUseExplicitRootLocale(defaultLocale))
  ) {
    return normalizedPath;
  }

  return addLocalePrefix(normalizedPath, locale);
}

function buildAbsoluteUrl(pathname: string): string {
  return new URL(pathname, siteConfig.siteUrl).toString();
}

function buildAlternates(pathname: string): NonNullable<Metadata["alternates"]> {
  const normalizedPath = normalizePagePath(pathname);
  const basePath = stripLocalePrefix(normalizedPath);
  const defaultLocale = getDeploymentDefaultLocale();
  const languages = {
    "zh-CN": buildAbsoluteUrl(buildRoutePath("zh", basePath, true)),
    "en-US": buildAbsoluteUrl(buildRoutePath("en", basePath, true)),
    "x-default": buildAbsoluteUrl(
      buildRoutePath(defaultLocale, basePath),
    ),
  } as const;

  return {
    canonical: buildAbsoluteUrl(normalizedPath),
    languages,
  };
}

function buildBaseMetadata(
  locale: Locale,
  pathname: string,
  options?: {
    title?: string;
    description?: string;
    keywords?: string[];
  },
): Metadata {
  const localeConfig = localizedSiteConfig[locale];
  const description = options?.description ?? localeConfig.description;
  const title = options?.title ?? { absolute: siteConfig.siteName };
  const displayTitle = options?.title ?? siteConfig.siteName;
  const absoluteUrl = buildAbsoluteUrl(pathname);

  return {
    metadataBase: new URL(siteConfig.siteUrl),
    title,
    description,
    keywords: [...(options?.keywords ?? localeConfig.keywords)],
    authors: [{ name: localeConfig.name }],
    alternates: buildAlternates(pathname),
    openGraph: {
      title: displayTitle,
      description,
      url: absoluteUrl,
      siteName: siteConfig.siteName,
      type: "website",
      locale: getOpenGraphLocale(locale),
      images: [
        {
          url: "/og.png",
          width: 1200,
          height: 630,
          alt: displayTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: displayTitle,
      description,
      images: [siteConfig.ogImagePath],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export function getHomePageMetadata(
  locale: Locale,
  explicitLocale = false,
): Metadata {
  const pathname = buildRoutePath(locale, "/", explicitLocale);
  return buildBaseMetadata(locale, pathname);
}

export function getExperiencePageMetadata(
  slug: string,
  locale: Locale,
  explicitLocale = false,
): Metadata | null {
  const item = getExperience(slug, locale);
  if (!item) return null;

  const localeConfig = localizedSiteConfig[locale];
  const title = "role" in item ? `${item.role} | ${item.company}` : item.name;
  const description = item.summary;
  const keywords = Array.from(
    new Set([...localeConfig.keywords, ...item.techTags]),
  );
  const pathname = buildRoutePath(
    locale,
    `/experiences/${item.id}`,
    explicitLocale,
  );

  return buildBaseMetadata(locale, pathname, {
    title: `${title} | ${localeConfig.name}`,
    description,
    keywords,
  });
}

export function getHomePageStructuredData(locale: Locale) {
  return getHomePageStructuredDataForRoute(locale);
}

export function getHomePageStructuredDataForRoute(
  locale: Locale,
  explicitLocale = false,
) {
  const localeConfig = localizedSiteConfig[locale];
  const data = getPortfolioData(locale);
  const works = data.projects
    .filter((project) => project.link?.includes("github.com"))
    .map((project) => ({
      "@type": "SoftwareSourceCode",
      name: project.name,
      description: project.summary,
      codeRepository: project.link,
      programmingLanguage: project.techTags.join(", "),
      author: {
        "@type": "Person",
        name: localeConfig.name,
      },
    }));

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        name: localeConfig.name,
        url: buildAbsoluteUrl(buildRoutePath(locale, "/", explicitLocale)),
        jobTitle: localeConfig.role,
        description: localeConfig.description,
        image: `${siteConfig.siteUrl}/og.png`,
        sameAs: ["https://github.com/byteD-x", siteConfig.siteUrl],
      },
      ...works,
    ],
  };
}

export function getExperienceStructuredData(
  slug: string,
  locale: Locale,
  explicitLocale = false,
) {
  const item = getExperience(slug, locale);
  if (!item) return null;

  const localeConfig = localizedSiteConfig[locale];
  const name = "role" in item ? `${item.role} - ${item.company}` : item.name;
  const url = buildAbsoluteUrl(
    buildRoutePath(locale, `/experiences/${slug}`, explicitLocale),
  );

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        name: localeConfig.name,
        url: buildAbsoluteUrl(buildRoutePath(locale, "/", explicitLocale)),
        jobTitle: localeConfig.role,
      },
      {
        "@type": item.link?.includes("github.com")
          ? "SoftwareSourceCode"
          : "CreativeWork",
        name,
        description: item.summary,
        url,
        ...(item.link ? { codeRepository: item.link } : {}),
        ...(item.techTags.length > 0
          ? { programmingLanguage: item.techTags.join(", ") }
          : {}),
      },
    ],
  };
}
