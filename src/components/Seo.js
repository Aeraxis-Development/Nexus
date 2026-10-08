import Head from "next/head";
import { useSiteUrl } from "@/context/SiteUrlContext";
import { DEFAULT_SITE_URL } from "@/lib/siteUrl";
import {
  AUTHOR,
  AUTHOR_URL,
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_PATH,
  OG_IMAGE_TYPE,
  OG_IMAGE_WIDTH,
  PUBLISHER,
  PUBLISHER_URL,
  SITE_NAME,
  THEME_COLOR,
  buildTitle,
  copyrightNotice,
  getSiteUrl,
  webAppJsonLd,
} from "@/lib/seo";

function joinUrl(base, path = "/") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!base) return normalized;
  return `${base.replace(/\/$/, "")}${normalized === "/" ? "" : normalized}`;
}

export default function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  image = OG_IMAGE_PATH,
  noIndex = false,
  keywords = DEFAULT_KEYWORDS,
  jsonLd,
  children,
}) {
  const contextualSiteUrl = useSiteUrl();
  const siteUrl = contextualSiteUrl || getSiteUrl() || DEFAULT_SITE_URL;
  const fullTitle = buildTitle(title);
  const canonical = joinUrl(siteUrl, path);
  const imageUrl = image.startsWith("http") ? image : joinUrl(siteUrl, image);
  const robots = noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large";

  const structuredData =
    jsonLd === null ? null : jsonLd ?? webAppJsonLd({ url: canonical, description, title: fullTitle });

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={AUTHOR} />
      <meta name="creator" content={AUTHOR} />
      <meta name="publisher" content={PUBLISHER} />
      <meta name="copyright" content={copyrightNotice()} />
      <meta name="application-name" content={SITE_NAME} />
      <meta name="apple-mobile-web-app-title" content={SITE_NAME} />
      <meta name="robots" content={robots} />
      <meta name="googlebot" content={robots} />
      <meta name="theme-color" content={THEME_COLOR} />
      <meta httpEquiv="content-language" content="en" />
      <link rel="canonical" href={canonical} />
      <link rel="author" href={AUTHOR_URL} />
      <link rel="publisher" href={PUBLISHER_URL} />
      <link rel="icon" href="/logo.png" type="image/png" />
      <link rel="apple-touch-icon" href="/logo.png" />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:alt" content={`${SITE_NAME} logo`} />
      <meta property="og:image:type" content={OG_IMAGE_TYPE} />
      <meta property="og:image:width" content={String(OG_IMAGE_WIDTH)} />
      <meta property="og:image:height" content={String(OG_IMAGE_HEIGHT)} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={`${SITE_NAME} logo`} />

      {siteUrl ? <meta property="og:image:secure_url" content={imageUrl} /> : null}

      {structuredData ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      ) : null}

      {children}
    </Head>
  );
}
