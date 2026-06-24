const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://dyzz-store.vercel.app").replace(/\/+$/, "");

function resolveUrl(pathOrUrl) {
  if (!pathOrUrl) return SITE_URL;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return new URL(pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`, `${SITE_URL}/`).toString();
}

export { SITE_URL, resolveUrl };
