import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Game from "./api/Game";
import Packages from "./api/Packages";
import Orders from "./api/Orders";
import { AdminAuthProvider, useAdminAuth } from "./admin/context/AdminAuthContext";
import AdminLayout from "./admin/layouts/AdminLayout";
import AdminLogin from "./admin/pages/AdminLogin";
import Dashboard from "./admin/pages/Dashboard";
import GameManagement from "./admin/pages/GameManagement";
import PackageManagement from "./admin/pages/PackageManagement";
import OrderManagement from "./admin/pages/OrderManagement";

function RequireAdminAuth({ children }) {
  const { isAuthenticated } = useAdminAuth();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

function App() {
  
  // 🎯 ផ្នែកកូដការពារ និងលាក់បាំង៖ បិទមិនឱ្យម៉ូយចុច Mouse ស្ដាំ ឬចុច F12 បើកមើល Network 
  useEffect(() => {
    // ១. បិទការចុច Mouse ស្ដាំ (Context Menu)
    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    // ២. បិទការចុច Shortcut Keys សំខាន់ៗ (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U)
    const handleKeyDown = (e) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && e.key === "I") || // បើក Inspect Element
        (e.ctrlKey && e.shiftKey && e.key === "J") || // បើក Console Panel
        (e.ctrlKey && (e.key === "u" || e.key === "U")) // បើកមើល Source Code របស់វេបសាយ
      ) {
        e.preventDefault();
      }
    };

    // ចាប់ផ្តើមដាក់ Listener ទៅលើ Window
    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown);

    // លុប Listener ចោលវិញពេល Component នេះត្រូវបានបិទ (Cleanup)
    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <Routes>
          {/* Client Routes */}
          <Route path="/" element={<Game />} />
          <Route path="/games/:id" element={<Packages />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:orderNo" element={<Orders />} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <RequireAdminAuth>
                <AdminLayout />
              </RequireAdminAuth>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="games" element={<GameManagement />} />
            <Route path="packages" element={<PackageManagement />} />
            <Route path="orders" element={<OrderManagement />} />
          </Route>
        </Routes>
      </AdminAuthProvider>
    </BrowserRouter>
  );
}

export default App;