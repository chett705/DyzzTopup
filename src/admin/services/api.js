import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") || "/api";

export const adminApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

function getStoredToken() {
  return (
    localStorage.getItem("admin_token") ||
    localStorage.getItem("adminToken") ||
    ""
  );
}

adminApi.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
    config.headers["X-Admin-Token"] = token;
  }

  return config;
});

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Request failed.";

    return Promise.reject(new Error(message));
  }
);
