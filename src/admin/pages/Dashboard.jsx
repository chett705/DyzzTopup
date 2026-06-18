import { useEffect, useState } from "react";
import { fetchAdminDashboard } from "../services/adminService";

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const result = await fetchAdminDashboard();
        if (!ignore) setData(result);
      } catch (err) {
        if (!ignore) setError(err.message || "Unable to load dashboard.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, []);

  const stats = data?.stats || data?.summary || {};

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">
          Overview
        </p>
        <h1 className="mt-2 text-3xl font-black">Dashboard</h1>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-300">
          Loading admin dashboard...
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-6 text-red-100">
          {error}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Orders" value={stats.orders ?? data?.orders?.length ?? 0} />
            <StatCard label="Packages" value={stats.packages ?? data?.packages?.length ?? 0} />
            <StatCard label="Games" value={stats.games ?? data?.games?.length ?? 0} />
            <StatCard label="Revenue" value={stats.revenue ?? "0"} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Recent Orders">
              <ListRows items={data?.orders || []} type="order" />
            </Panel>
            <Panel title="Recent Packages">
              <ListRows items={data?.packages || []} type="package" />
            </Panel>
          </div>
        </>
      )}
    </section>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function ListRows({ items, type }) {
  if (!items.length) {
    return <p className="text-sm text-slate-400">No {type}s returned by the API.</p>;
  }

  return (
    <div className="grid gap-3">
      {items.slice(0, 6).map((item) => (
        <div key={item.id || item.order_no || item.name} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
          <p className="font-semibold text-white">
            {type === "order" ? item.order_no || item.id || "-" : item.name || item.id || "-"}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {type === "order"
              ? `${item.order_status || item.status || "Pending"}`
              : `${item.price ?? "-"} price`}
          </p>
        </div>
      ))}
    </div>
  );
}

export default Dashboard;
