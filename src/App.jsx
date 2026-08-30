import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Game from "./api/Game";
// import Game from "./api/Game";
import Loading from "./components/Loading";

import Packages from "./api/Packages";
import Orders from "./api/Orders";
import { AdminAuthProvider, useAdminAuth } from "./admin/context/AdminAuthContext";
import AdminLayout from "./admin/layouts/AdminLayout";
import AdminLogin from "./admin/pages/AdminLogin";
import Dashboard from "./admin/pages/Dashboard";
import GameManagement from "./admin/pages/GameManagement";
import PackageManagement from "./admin/pages/PackageManagement";
import OrderManagement from "./admin/pages/OrderManagement";
import { Analytics } from "@vercel/analytics/react";

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
    
  }, []);

  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <Routes>
          {/* Client Routes */}
          {/* <Route path="/" element={<Game />} /> */}
          <Route path="/" element={<Loading />} />

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
      <Analytics />
    </BrowserRouter>
    
  );
}

export default App;