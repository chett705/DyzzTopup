import { useEffect, useState } from "react";
import { fetchAdminDashboard, updateAdminOrder } from "../services/adminService";

function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [drafts, setDrafts] = useState({});

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const result = await fetchAdminDashboard();
        const items = Array.isArray(result?.orders) ? result.orders : [];
        if (!ignore) {
          setOrders(items);
          const nextDrafts = {};
          items.forEach((order) => {
            nextDrafts[order.id] = {
              order_status: order.order_status ?? order.status ?? "",
              payment_status: order.payment_status ?? order.payment?.status ?? "",
            };
          });
          setDrafts(nextDrafts);
        }
      } catch (err) {
        if (!ignore) setError(err.message || "Unable to load orders.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, []);

  function updateDraft(id, field, value) {
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...(current[id] || {}),
        [field]: value,
      },
    }));
  }

  async function saveOrder(id) {
    const draft = drafts[id];
    try {
      setSavingId(id);
      setError("");
      const result = await updateAdminOrder(id, draft);
      const updated = result?.order || result?.data?.order || result;
      if (updated) {
        setOrders((current) =>
          current.map((item) => (String(item.id) === String(id) ? { ...item, ...updated } : item))
        );
      }
    } catch (err) {
      setError(err.message || "Unable to update order.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">
          Management
        </p>
        <h1 className="mt-2 text-3xl font-black">Order Management</h1>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-300">
          Loading orders...
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-6 text-red-100">
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-300">
          No orders found.
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => {
            const draft = drafts[order.id] || {};
            return (
              <article key={order.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                  <label className="grid gap-2">
                    <span className="text-xs uppercase tracking-[0.25em] text-slate-400">
                      Order Status
                    </span>
                    <input
                      value={draft.order_status ?? ""}
                      onChange={(e) => updateDraft(order.id, "order_status", e.target.value)}
                      className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-cyan-400/60"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs uppercase tracking-[0.25em] text-slate-400">
                      Payment Status
                    </span>
                    <input
                      value={draft.payment_status ?? ""}
                      onChange={(e) => updateDraft(order.id, "payment_status", e.target.value)}
                      className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-cyan-400/60"
                    />
                  </label>
                </div>

                <div className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-2 lg:grid-cols-4">
                  <div>Order No: {order.order_no || order.id || "-"}</div>
                  <div>Player ID: {order.player_id || "-"}</div>
                  <div>Zone ID: {order.zone_id || "-"}</div>
                  <div>Amount: {order.amount ?? "-"}</div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="text-sm text-slate-400">
                    Package: {order.package?.name || order.package_name || order.package_id || "-"}
                  </div>
                  <button
                    type="button"
                    onClick={() => saveOrder(order.id)}
                    disabled={savingId === order.id}
                    className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingId === order.id ? "Saving..." : "Save Order"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default OrderManagement;
