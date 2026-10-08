import { DEFAULT_SITE_URL, resolveSiteUrl } from "@/lib/siteUrl";

export const SITE_NAME = "Nexus";
export const SITE_TAGLINE = "Discord Dev Toolkit";
export const DEFAULT_TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const DEFAULT_DESCRIPTION =
  "All-in-one Discord developer toolkit. Permissions, OAuth, embeds, snowflakes, user flags, mentions, CDN URLs, and more.";
export const DEFAULT_KEYWORDS =
  "discord, bot, permissions, calculator, oauth, embed, webhook, snowflake, flags, mentions, nexus, discord toolkit, discord developer tools, aeraxis, aeraxis development";
export const THEME_COLOR = "#0d9488";
export const PUBLISHER = "Aeraxis Development";
export const PUBLISHER_URL = "https://aeraxis.dev";
export const AUTHOR = PUBLISHER;
export const AUTHOR_URL = PUBLISHER_URL;
export const DEV_TEAM_URL = PUBLISHER_URL;
export const DISCORD_URL = "https://discord.gg/thunderdoesdev";
export const OG_IMAGE_PATH = "/og.jpg";
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
export const OG_IMAGE_TYPE = "image/jpeg";

/** Public site origin without trailing slash. Defaults to nexus.aeraxis.dev. */
export function getSiteUrl() {
  return resolveSiteUrl() || DEFAULT_SITE_URL;
}

export function absoluteUrl(path = "/") {
  const base = getSiteUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!base) return normalized;
  return `${base}${normalized === "/" ? "" : normalized}`;
}

export function buildTitle(pageTitle) {
  if (!pageTitle || pageTitle === DEFAULT_TITLE) return DEFAULT_TITLE;
  if (pageTitle.includes(SITE_NAME)) return pageTitle;
  return `${SITE_NAME} — ${pageTitle}`;
}

export function copyrightYear() {
  return new Date().getFullYear();
}

export function copyrightNotice() {
  return `© ${copyrightYear()} ${PUBLISHER}`;
}

function entityId(url, fragment) {
  if (!url) return undefined;
  return `${url.replace(/\/$/, "")}/#${fragment}`;
}

function originFrom(url) {
  if (!url || !/^https?:\/\//i.test(url)) return "";
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
}

export function webAppJsonLd({
  url,
  description = DEFAULT_DESCRIPTION,
  title = DEFAULT_TITLE,
} = {}) {
  const siteUrl = getSiteUrl() || originFrom(url) || undefined;
  const pageUrl = url || siteUrl;
  const orgId = entityId(siteUrl, "organization");
  const websiteId = entityId(siteUrl, "website");
  const appId = entityId(siteUrl, "app");
  const pageId = entityId(pageUrl, "webpage");
  const orgRef = orgId ? { "@id": orgId } : undefined;

  const organization = {
    "@type": "Organization",
    name: PUBLISHER,
    url: PUBLISHER_URL,
    sameAs: [PUBLISHER_URL, DISCORD_URL],
  };
  if (orgId) organization["@id"] = orgId;

  const website = {
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: siteUrl,
    inLanguage: "en",
    publisher: orgRef || organization,
    author: orgRef || organization,
    copyrightHolder: orgRef || organization,
    copyrightYear: copyrightYear(),
  };
  if (websiteId) website["@id"] = websiteId;

  const app = {
    "@type": "WebApplication",
    name: SITE_NAME,
    alternateName: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: siteUrl,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript",
    inLanguage: "en",
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: orgRef || organization,
    creator: orgRef || organization,
    publisher: orgRef || organization,
    sourceOrganization: orgRef || organization,
    copyrightHolder: orgRef || organization,
    copyrightYear: copyrightYear(),
  };
  if (appId) app["@id"] = appId;
  if (websiteId) app.isPartOf = { "@id": websiteId };

  const graph = [organization, website, app];

  if (pageUrl) {
    const webpage = {
      "@type": "WebPage",
      name: title,
      description,
      url: pageUrl,
      inLanguage: "en",
      isPartOf: websiteId ? { "@id": websiteId } : website,
      about: appId ? { "@id": appId } : app,
      author: orgRef || organization,
      publisher: orgRef || organization,
      copyrightHolder: orgRef || organization,
    };
    if (pageId) webpage["@id"] = pageId;
    graph.push(webpage);
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

export const PAGE_SEO = {
  home: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    path: "/",
  },
  tools: {
    title: "All Discord Tools",
    description:
      "Browse every Nexus Discord utility — permissions, embeds, lookups, CDN assets, AutoMod, and more in one catalog.",
    path: "/tools",
  },
  dashboard: {
    title: "Dashboard",
    description: "Manage your Discord servers connected to Nexus and open bot-powered tools.",
    path: "/dashboard",
    noIndex: true,
  },
  notFound: {
    title: "Page not found",
    description: "This page does not exist. Return to the Nexus Discord developer toolkit.",
    path: "/404",
    noIndex: true,
  },
};
