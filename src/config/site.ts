const defaultSiteUrl = "https://www.byted.online";
const envSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "")
  .trim()
  .replace(/\/+$/g, "");

const siteUrl = envSiteUrl || defaultSiteUrl;

export const localizedSiteConfig = {
  zh: {
    name: "杜旭嘉",
    role: "AI 应用工程师（RAG / Agent）",
    description:
      "AI 应用工程师，主攻检索增强、智能体运行时与业务系统集成，强调可验证、可维护的工程交付与真实业务落地。",
    keywords: [
      "AI 应用工程师",
      "RAG",
      "Agent",
      "Agent Runtime",
      "FastAPI",
      "LangGraph",
      "Python",
      "Next.js",
      "Portfolio",
      "Resume",
    ],
  },
  en: {
    name: "Xujia Du",
    role: "AI Application Engineer (RAG / Agent)",
    description:
      "AI application engineer focused on retrieval augmentation, agent runtimes, and business-system integration, with verifiable and maintainable engineering delivery.",
    keywords: [
      "AI Application Engineer",
      "RAG",
      "Agent",
      "Agent Runtime",
      "FastAPI",
      "LangGraph",
      "Python",
      "Next.js",
      "Portfolio",
      "Resume",
    ],
  },
} as const;

export const siteConfig = {
  ...localizedSiteConfig.zh,
  siteName: "作品小集",
  siteUrl,
  email: "2041487752dxj@gmail.com",
  icpRecord: "晋ICP备2026004157号-1",
  icpRecordUrl: "https://beian.miit.gov.cn/",
  ogImagePath: "/og.png",
} as const;

export type SiteConfig = typeof siteConfig;
