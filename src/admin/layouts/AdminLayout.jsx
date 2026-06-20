import { NavLink, Outlet } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

const navItems = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/games", label: "Games" },
  { to: "/admin/packages", label: "Packages" },
  { to: "/admin/orders", label: "Orders" },
];

function AdminLayout() {
  const { adminUser, logout } = useAdminAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-4 lg:grid-cols-[260px_1fr] lg:px-6">
        <aside className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/15 to-fuchsia-500/10 p-4">
            {/* <p className="text-xs uppercase tracking-[0.35em] text-cyan-200">
              Admin Panel
            </p> */}
            <h1 className="mt-2 text-2xl font-black">Dyzztopup</h1>
            {/* <p className="mt-1 text-sm text-slate-300">
              Manage games, packages, and orders from one place.
            </p> */}
          </div>

          <nav className="mt-5 grid gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-cyan-400/15 text-cyan-100 ring-1 ring-cyan-400/20"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="flex min-h-screen flex-col gap-6">
          <header className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {/* <p className="text-xs uppercase tracking-[0.35em] text-fuchsia-200">
                  Logged in as
                </p> */}
                <h2 className="mt-1 text-xl font-bold">
                  {adminUser?.name || adminUser?.email || "Admin"}
                </h2>
              </div>

              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                Logout
              </button>
            </div>
          </header>

          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
