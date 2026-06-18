import { adminApi } from "./api";

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? response;
}

export async function loginAdmin(payload) {
  const response = await adminApi.post("/admin/login", payload);
  return unwrap(response);
}

export async function logoutAdmin() {
  const response = await adminApi.post("/admin/logout");
  return unwrap(response);
}

export async function fetchAdminDashboard() {
  const response = await adminApi.get("/admin/dashboard");
  return unwrap(response);
}

export async function updateAdminPackage(packageId, payload) {
  const response = await adminApi.patch(
    `/admin/packages/${encodeURIComponent(packageId)}`,
    payload
  );
  return unwrap(response);
}

export async function updateAdminOrder(orderId, payload) {
  const response = await adminApi.patch(
    `/admin/orders/${encodeURIComponent(orderId)}`,
    payload
  );
  return unwrap(response);
}

export async function createAdminGame(payload) {
  const response = await adminApi.post("/admin/games", payload);
  return unwrap(response);
}
