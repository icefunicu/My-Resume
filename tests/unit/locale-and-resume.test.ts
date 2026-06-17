import { describe, expect, it } from "vitest";
import {
  addLocalePrefix,
  getDefaultLocale,
  normalizeLocale,
  resolveLocalePath,
} from "@/lib/locale";
import {
  getDeploymentDefaultLocale,
  getRootLocaleEntryPath,
  shouldUseExplicitRootLocale,
} from "@/lib/deployment-locale";
import { siteConfig } from "@/config/site";
import {
  getExperiencePageMetadata,
  getHomePageMetadata,
  getHomePageStructuredDataForRoute,
} from "@/lib/page-metadata";
import {
  EN_RESUME_FILE_NAME,
  RESUME_FILE_NAME,
  formatResumeFileName,
  getResumeDownloadUrl,
} from "@/lib/resume";

describe("locale helpers", () => {
  it("falls back to zh when locale is invalid", () => {
    expect(normalizeLocale("jp")).toBe("zh");
    expect(normalizeLocale(undefined)).toBe("zh");
  });

  it("builds locale-prefixed paths", () => {
    expect(resolveLocalePath("/", "en")).toBe("/en");
    expect(resolveLocalePath("/experiences/demo", "zh")).toBe(
      "/zh/experiences/demo",
    );
    expect(addLocalePrefix("/projects", "en")).toBe("/en/projects");
  });

  it("reads build-time default locale with zh fallback", () => {
    expect(getDefaultLocale("en")).toBe("en");
    expect(getDefaultLocale("oops")).toBe("zh");
  });

  it("infers the Vercel default locale when public config is missing", () => {
    expect(
      getDeploymentDefaultLocale({ configuredLocale: null, vercelFlag: "1" }),
    ).toBe("en");
    expect(
      getDeploymentDefaultLocale({ configuredLocale: null, vercelFlag: null }),
    ).toBe("zh");
  });

  it("builds the root entry path from the deployment locale", () => {
    expect(shouldUseExplicitRootLocale("en")).toBe(true);
    expect(shouldUseExplicitRootLocale("zh")).toBe(false);
    expect(getRootLocaleEntryPath("en")).toBe("/en");
    expect(getRootLocaleEntryPath("zh")).toBe("/");
  });
});

describe("resume locale selection", () => {
  it("returns locale-specific resume filenames", () => {
    expect(formatResumeFileName(undefined, undefined, "-", "zh")).toBe(
      RESUME_FILE_NAME,
    );
    expect(formatResumeFileName(undefined, undefined, "-", "en")).toBe(
      EN_RESUME_FILE_NAME,
    );
  });

  it("returns locale-specific API download URLs", () => {
    expect(getResumeDownloadUrl(RESUME_FILE_NAME, "zh")).toBe("/api/resume");
    expect(getResumeDownloadUrl(EN_RESUME_FILE_NAME, "en")).toBe(
      "/api/resume?locale=en",
    );
  });
});

describe("metadata locale paths", () => {
  const originalDefaultLocale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE;

  beforeAll(() => {
    process.env.NEXT_PUBLIC_DEFAULT_LOCALE = "en";
  });

  afterAll(() => {
    if (originalDefaultLocale === undefined) {
      delete process.env.NEXT_PUBLIC_DEFAULT_LOCALE;
      return;
    }

    process.env.NEXT_PUBLIC_DEFAULT_LOCALE = originalDefaultLocale;
  });

  it("uses the registered site name for home metadata", () => {
    const metadata = getHomePageMetadata("zh");

    expect(metadata.title).toEqual({ absolute: siteConfig.siteName });
    expect(metadata.openGraph).toMatchObject({
      title: siteConfig.siteName,
      siteName: siteConfig.siteName,
    });
  });

  it("keeps alternates and canonical aligned for the explicit English home route", () => {
    const metadata = getHomePageMetadata("en", true);

    expect(metadata.alternates?.canonical).toBe(`${siteConfig.siteUrl}/en`);
    expect(metadata.alternates?.languages?.["zh-CN"]).toBe(
      `${siteConfig.siteUrl}/zh`,
    );
    expect(metadata.alternates?.languages?.["en-US"]).toBe(
      `${siteConfig.siteUrl}/en`,
    );
    expect(metadata.alternates?.languages?.["x-default"]).toBe(
      `${siteConfig.siteUrl}/en`,
    );
  });

  it("does not duplicate locale prefixes for localized experience pages", () => {
    const metadata = getExperiencePageMetadata("exp-rentbox", "en", true);

    expect(metadata?.alternates?.canonical).toBe(
      `${siteConfig.siteUrl}/en/experiences/exp-rentbox`,
    );
    expect(metadata?.alternates?.languages?.["zh-CN"]).toBe(
      `${siteConfig.siteUrl}/zh/experiences/exp-rentbox`,
    );
    expect(metadata?.alternates?.languages?.["en-US"]).toBe(
      `${siteConfig.siteUrl}/en/experiences/exp-rentbox`,
    );
  });

  it("uses the explicit locale path in structured data when requested", () => {
    const structuredData = getHomePageStructuredDataForRoute("en", true) as {
      "@graph": Array<{ "@type": string; url?: string }>;
    };

    const person = structuredData["@graph"].find(
      (entry) => entry["@type"] === "Person",
    );
    expect(person?.url).toBe(`${siteConfig.siteUrl}/en`);
  });
});
