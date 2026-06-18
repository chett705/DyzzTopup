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
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <Routes>
          <Route path="/" element={<Game />} />
          <Route path="/games/:id" element={<Packages />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:orderNo" element={<Orders />} />

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
