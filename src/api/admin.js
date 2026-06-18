import { requestJson } from "./api";

function adminHeaders(token, extraHeaders = {}) {
  if (!token) return extraHeaders;

  return {
    Authorization: `Bearer ${token}`,
    "X-Admin-Token": token,
    ...extraHeaders,
  };
}

export async function adminLogin(payload) {
  return requestJson("/admin/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function adminLogout(token, extraHeaders = {}) {
  return requestJson("/admin/logout", {
    method: "POST",
    headers: adminHeaders(token, extraHeaders),
  });
}

export async function fetchAdminDashboard(token, extraHeaders = {}) {
  return requestJson("/admin/dashboard", {
    method: "GET",
    headers: adminHeaders(token, extraHeaders),
  });
}

export async function updateAdminPackage(packageId, payload, token, extraHeaders = {}) {
  return requestJson(`/admin/packages/${encodeURIComponent(packageId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
    headers: adminHeaders(token, extraHeaders),
  });
}

export async function updateAdminOrder(orderId, payload, token, extraHeaders = {}) {
  return requestJson(`/admin/orders/${encodeURIComponent(orderId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
    headers: adminHeaders(token, extraHeaders),
  });
}

