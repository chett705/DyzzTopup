const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") || "/api/topup";

function buildUrl(path) {
  if (!path) return API_BASE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("/")) return `${API_BASE_URL}${path}`;
  return `${API_BASE_URL}/${path}`;
}

function normalizeError(message, fallback) {
  return message || fallback;
}

export async function requestJson(path, options = {}) {
  const response = await fetch(buildUrl(path), {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json().catch(() => null) : await response.text();

  if (!response.ok) {
    const errorMessage =
      (payload && typeof payload === "object" && (payload.message || payload.error)) ||
      (typeof payload === "string" && payload.trim()) ||
      `Request failed with status ${response.status}`;

    throw new Error(normalizeError(errorMessage, "Request failed."));
  }

  return payload;
}

export function getImageUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("/")) return path;

  const assetBase = import.meta.env.VITE_ASSET_BASE_URL?.replace(/\/+$/, "");
  if (assetBase) {
    return `${assetBase}/${path.replace(/^\/+/, "")}`;
  }

  return `${window.location.origin}/${path.replace(/^\/+/, "")}`;
}

export function getKhqrPaymentUrl(orderId) {
  if (!orderId && orderId !== 0) return "";
  return buildUrl(`/orders/${encodeURIComponent(orderId)}/checkout`);
}
