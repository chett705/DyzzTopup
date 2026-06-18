/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loginAdmin, logoutAdmin } from "../services/adminService";

const AdminAuthContext = createContext(null);
const STORAGE_KEY = "admin_token";
const ADMIN_USER_KEY = "admin_user";

export function AdminAuthProvider({ children }) {
  // ១. ចាប់ផ្ដើមទាញយកទិន្នន័យ Token ពី LocalStorage
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY) || "");
  
  // ២. ចាប់ផ្ដើមទាញយកទិន្នន័យ User ពី LocalStorage
  const [adminUser, setAdminUser] = useState(() => {
    const raw = localStorage.getItem(ADMIN_USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      localStorage.removeItem(ADMIN_USER_KEY); // បើ Parse ខូច គឺលុបចោលតែម្ដង
      return null;
    }
  });

  // ៣. តាមដានការប្រែប្រួល Token ដើម្បីរក្សាទុកក្នុង LocalStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem(STORAGE_KEY, token);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [token]);

  // ៤. តាមដានការប្រែប្រួល Admin User ដើម្បីរក្សាទុកក្នុង LocalStorage
  useEffect(() => {
    if (adminUser) {
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(adminUser));
    } else {
      localStorage.removeItem(ADMIN_USER_KEY);
    }
  }, [adminUser]);

  // ៥. Function សម្រាប់ដំណើរការ Login
  async function login(credentials) {
    const result = await loginAdmin(credentials);
    
    const nextToken =
      result?.token ||
      result?.access_token ||
      result?.accessToken ||
      result?.data?.token ||
      result?.data?.accessToken ||
      "";
      
    const nextAdmin =
      result?.admin ||
      result?.user ||
      result?.data?.admin ||
      result?.data?.user ||
      null;

    if (nextToken) setToken(nextToken);
    if (nextAdmin) setAdminUser(nextAdmin);

    return result;
  }

  // ៦. Function សម្រាប់ដំណើរការ Logout
  async function logout() {
    try {
      await logoutAdmin();
    } catch (error) {
      console.error("ការហៅ API Logout ទៅកាន់ Laravel មានបញ្ហា:", error);
    } finally {
      // ទោះជា API Laravel មានបញ្ហាក៏ដោយ ក៏ត្រូវសម្អាតទិន្នន័យលើ Frontend ចោលដែរ
      setToken("");
      setAdminUser(null);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ADMIN_USER_KEY);
    }
  }

  // ៧. ចងចាំតម្លៃដើម្បីកុំឱ្យ Component ធ្វើការ Re-render ផ្ដេសផ្ដាស
  const value = useMemo(
    () => ({
      token,
      adminUser,
      isAuthenticated: Boolean(token),
      login,
      logout,
      setToken,
      setAdminUser,
    }),
    [adminUser, token]
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

// ៨. Hook សម្រាប់យកទៅប្រើប្រាស់ក្នុងទំព័រផ្សេងៗ (ដូចជា AdminLayout)
export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used inside AdminAuthProvider.");
  }
  return context;
}