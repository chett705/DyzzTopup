import axios from "axios";

const ADMIN_BASE_URL = "https://dystoreback.onrender.com/api";

export const adminApi = axios.create({
  baseURL: ADMIN_BASE_URL,
});

adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("admin_token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
      config.headers["X-Admin-Token"] = token;
    }
    config.headers["Accept"] = "application/json";
    config.headers["Content-Type"] = "application/json";
    return config;
  },
  (error) => Promise.reject(error)
);

function unwrap(response) {
  // 🎯 កែសម្រួល៖ ធានាការទាញយក data ឱ្យត្រូវស្រទាប់ មិនឱ្យមានបញ្ហា Empty Array ក្នុង Admin ឡើយ
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
  const response = await adminApi.patch(`/admin/packages/${encodeURIComponent(packageId)}`, payload);
  return unwrap(response);
}

export async function createAdminPackage(payload) {
  const response = await adminApi.post("/admin/packages", payload);
  return unwrap(response);
}

export async function updateAdminOrder(orderId, payload) {
  const response = await adminApi.patch(`/admin/orders/${encodeURIComponent(orderId)}`, payload);
  return unwrap(response);
}

export async function createAdminGame(payload) {
  const response = await adminApi.post("/admin/games", payload);
  return unwrap(response);
}

/**
 * ⚡ មុខងារចុចបង្ខំឱ្យជោគជ័យ (Bypass Success)
 * 🎯 ដំណោះស្រាយ៖ លុបពាក្យ /admin ដែលជាន់គ្នាចេញ ឱ្យត្រូវគ្នាបេះបិទជាមួយ Laravel Route 
 */
export async function manualVerifyOrder(orderId) {
  const response = await adminApi.post(`/admin/orders/${encodeURIComponent(orderId)}/manual-verify`);
  return unwrap(response);
}

/**
 * ❌ មុខងារចុចលុប Order ពី Database
 * 🎯 ដំណោះស្រាយ៖ លុបពាក្យ /admin ដែលជាន់គ្នាចេញដូចគ្នា ដើម្បីកុំឱ្យលោត Error 404
 */
export async function deleteAdminOrder(orderId) {
  const response = await adminApi.delete(`/admin/orders/${encodeURIComponent(orderId)}`);
  return response?.data ?? response;
}