import { Helmet } from "react-helmet-async";

import { resolveUrl } from "../seoConfig";

const DEFAULT_TITLE = "Dyzz Store | Game Top Up Cambodia";
const DEFAULT_DESCRIPTION =
  "Top up Mobile Legends, Free Fire, PUBG Mobile, and other games in Cambodia with fast delivery and secure KHQR payment.";
const DEFAULT_IMAGE = "/bannerlistgame.png";
const DEFAULT_KEYWORDS =
  "game top up cambodia, mobile legends top up, free fire top up, pubg mobile uc, dyzz store, khqr payment";

function Seo({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  canonicalPath = "/",
  image = DEFAULT_IMAGE,
  keywords = DEFAULT_KEYWORDS,
  noIndex = false,
  schema,
}) {
  const canonicalUrl = resolveUrl(canonicalPath);
  const imageUrl = resolveUrl(image);
  const robots = noIndex ? "noindex, nofollow, noarchive" : "index, follow, max-image-preview:large";
  const pageTitle = title.includes("Dyzz Store") ? title : `${title} | Dyzz Store`;

  return (
    <Helmet>
      <html lang="en" />
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content={robots} />
      <meta name="author" content="Dyzz Store" />
      <meta name="theme-color" content="#0f172a" />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Dyzz Store" />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:alt" content={title} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {schema ? (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ) : null}
    </Helmet>
  );
}
export default Seo;
