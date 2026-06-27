import React, { useEffect, useState } from "react";
import {
  fetchAdminDashboard,
  updateAdminOrder,
  manualVerifyOrder,
  deleteAdminOrder,
} from "../services/adminService";
import Swal from "sweetalert2";

function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [drafts, setDrafts] = useState({});

  // 📊 បង្ហាញលីមីតបញ្ជីដំបូង ៥ បញ្ជាទិញ
  const [visibleCount, setVisibleCount] = useState(5);

  // 🎯 ប្រព័ន្ធ Auto-Refresh (Polling) ទាញយកទិន្នន័យថ្មីរៀងរាល់ ៥ វិនាទីម្ដងស្វ័យប្រវត្ត
  useEffect(() => {
    let ignore = false;

    async function load(isSilent = false) {
      try {
        if (!isSilent) setLoading(true);
        const result = await fetchAdminDashboard();
        
        let items = [];
        if (result?.orders && Array.isArray(result.orders)) {
          items = result.orders;
        } else if (result?.data?.orders && Array.isArray(result.data.orders)) {
          items = result.data.orders;
        } else if (result?.data && Array.isArray(result.data)) {
          items = result.data;
        } else if (Array.isArray(result)) {
          items = result;
        }

        // 🎯 ធ្វើម៉ាស៊ីន Mapper ធានាចាប់យក Username គ្រប់ច្រក Key
        const mappedItems = items.map((order) => {
          const finalUsername = order.player_username 
            || order.username 
            || order.player_name 
            || order.player_id_name 
            || "";
          return {
            ...order,
            player_username: finalUsername 
          };
        });

        if (!ignore) {
          setOrders(mappedItems);
          
          setDrafts((currentDrafts) => {
            const nextDrafts = { ...currentDrafts };
            mappedItems.forEach((order) => {
              if (!nextDrafts[order.id]) {
                nextDrafts[order.id] = {
                  status: order.status ?? "pending",
                };
              }
            });
            return nextDrafts;
          });
        }
      } catch (err) {
        if (!ignore && !isSilent) setError(err.message || "Unable to load orders.");
      } finally {
        if (!ignore && !isSilent) setLoading(false);
      }
    }

    load(false);

    const intervalId = setInterval(() => {
      load(true);
    }, 5000);

    return () => {
      ignore = true;
      clearInterval(intervalId);
    };
  }, []);

  // ❌ មុខងារលុប Order 
  async function handleDeleteOrder(id) {
    const confirmResult = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this order!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirmResult.isConfirmed) return;

    try {
      setSavingId(id);
      const result = await deleteAdminOrder(id);

      if (result) {
        setOrders((current) => current.filter((item) => String(item.id) !== String(id)));
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Order has been removed from database.",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Delete Failed", text: err.message, confirmButtonColor: "#ef4444" });
    } finally {
      setSavingId(null);
    }
  }

  function updateDraft(id, field, value) {
    setDrafts((current) => ({
      ...current,
      [id]: { ...(current[id] || {}), [field]: value },
    }));
  }

  // 💾 មុខងារ Save ស្ថានភាពដែលវាយដោយដៃ
  async function saveOrder(id) {
    const draft = drafts[id];
    try {
      setSavingId(id);
      setError("");

      const result = await updateAdminOrder(id, { status: draft.status });
      const updated = result?.order || result?.data?.order || result;

      if (updated) {
        setOrders((current) =>
          current.map((item) => String(item.id) === String(id) ? { ...item, ...updated, status: draft.status } : item)
        );
        Swal.fire({ icon: "success", title: "Saved!", text: "Order status updated.", timer: 1500, showConfirmButton: false });
      }
    } catch (err) {
      setError(err.message || "Unable to update order.");
    } finally {
      setSavingId(null);
    }
  }

  // ⚡ មុខងារចុចបង្ខំឱ្យជោគជ័យ និងបាញ់ពេជ្រទៅ FlashTopUp (Bypass Success)
  async function handleManualVerify(id) {
    try {
      setSavingId(id);
      setError("");

      const result = await manualVerifyOrder(id);
      const updated = result?.order || result?.data?.order || result;
      const finalStatus = updated?.status || "success";

      setOrders((current) =>
        current.map((item) => String(item.id) === String(id) ? { ...item, ...updated, status: finalStatus } : item)
      );
      setDrafts((prev) => ({ ...prev, [id]: { status: finalStatus } }));

      Swal.fire({ 
        icon: "success", 
        title: "Bypass Dispatched!", 
        text: "Order approved and pushed to FlashTopUp successfully.", 
        confirmButtonColor: "#06b6d4" 
      });

    } catch (err) {
      Swal.fire({ 
        icon: "error", 
        title: "Bypass Failed", 
        text: err.response?.data?.message || err.message || "FlashTopUp API refused this request.", 
        confirmButtonColor: "#ef4444" 
      });
    } finally {
      setSavingId(null);
    }
  }

  // 🖨️ មុខងារបោះពុម្ភវិក្កយបត្រ
  function handleDownloadReceipt(order) {
    const printWindow = window.open("", "_blank");
    const htmlContent = `
      <html>
        <head>
          <title>Receipt - ${order.order_no || order.id}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 30px; color: #333; }
            .receipt-box { max-width: 400px; margin: 0 auto; border: 1px dashed #ccc; padding: 20px; }
            .title { text-align: center; font-size: 22px; font-weight: bold; margin-bottom: 5px; }
            .subtitle { text-align: center; font-size: 12px; color: #666; margin-bottom: 20px; }
            .divider { border-top: 1px dashed #333; margin: 15px 0; }
            .item-row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px; }
            .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            <div class="title">DYZZ STORE</div>
            <div class="subtitle">GAME TOP-UP RECEIPT</div>
            <div class="divider"></div>
            <div class="item-row"><span>Order No:</span> <strong>${order.order_no || order.id || "-"}</strong></div>
            <div class="item-row"><span>Player ID:</span> <span>${order.player_id || "-"}</span></div>
            <div class="item-row"><span>Username:</span> <strong style="color: #10b981;">${order.player_username || "No Name"}</strong></div>
            ${order.zone_id ? `<div class="item-row"><span>Zone ID:</span> <span>${order.zone_id}</span></div>` : ""}
            <div class="item-row"><span>Package:</span> <span>${order.package?.name || order.package_name || "-"}</span></div>
            <div class="item-row"><span>Status:</span> <span>${order.status || "Pending"}</span></div>
            <div class="divider"></div>
            <div class="total-row"><span>Amount Paid:</span> <span>$${Number(order.amount ?? 0).toFixed(2)}</span></div>
          </div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }

  const displayedOrders = orders.slice(0, visibleCount);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Management</p>
          <h1 className="mt-2 text-3xl font-black">Order Management</h1>
        </div>
        <div className="text-sm font-semibold text-slate-400">
          Total: {orders.length} orders
        </div>
      </div>

      {loading ? (
        <div className="space-y-4" aria-busy="true" aria-live="polite">
          {Array.from({ length: 4 }).map((_, index) => (
            <article key={index} className="animate-pulse rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="h-4 w-40 rounded-full bg-white/10" />
                <div className="h-8 w-24 rounded-full bg-white/10" />
              </div>
              <div className="mt-4 grid gap-2 border-y border-white/5 py-3 sm:grid-cols-2 lg:grid-cols-5">
                {Array.from({ length: 5 }).map((__, rowIndex) => (
                  <div key={rowIndex} className="h-4 rounded-full bg-slate-950/40" />
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-6 text-red-100">{error}</div>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-300">No orders found.</div>
      ) : (
        <div className="grid gap-4">
          {displayedOrders.map((order) => {
            const draft = drafts[order.id] || {};
            const isPending = order.status === "pending" || order.status === "manual_hold";

            return (
              <article key={order.id} className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
                <div className="grid gap-4 grid-cols-1">
                  <label className="grid gap-2">
                    <span className="text-xs uppercase tracking-[0.25em] text-slate-400">Order Status</span>
                    <input
                      value={draft.status ?? ""}
                      onChange={(e) => updateDraft(order.id, "status", e.target.value)}
                      className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-cyan-400/60 font-semibold"
                      placeholder="e.g., pending, success, failed"
                    />
                  </label>
                </div>

                <div className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-2 lg:grid-cols-5 border-y border-white/5 py-3 my-3">
                  <div>Order No: <span className="font-mono text-cyan-200 text-xs">{order.order_no || order.id || "-"}</span></div>
                  <div>Player ID: <span className="font-semibold">{order.player_id || "-"}</span></div>
                  <div>Username: <span className="text-emerald-400 font-bold">{order.player_username || "No Name"}</span></div>
                  <div>Zone ID: <span className="font-semibold">{order.zone_id || "-"}</span></div>
                  <div>Amount: <span className="text-emerald-400 font-bold">${Number(order.amount ?? 0).toFixed(2)}</span></div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-slate-400 flex items-center gap-3">
                    <span>Package: <strong className="text-white">{order.package?.name || order.package_name || "-"}</strong></span>
                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border transition-all duration-300 ${
                      order.status === "success"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : order.status === "pending"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}>
                      {order.status || "pending"}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {/* {isPending && (
                      <button
                        type="button"
                        onClick={() => handleManualVerify(order.id)}
                        disabled={savingId === order.id}
                        className="rounded-full border border-fuchsia-500/40 bg-fuchsia-500/10 px-4 py-2 text-sm font-semibold text-fuchsia-300 hover:bg-fuchsia-500 hover:text-white transition disabled:opacity-50 cursor-pointer"
                      >
                        {savingId === order.id ? "Bypassing..." : "Bypass Success"}
                      </button>
                    )} */}

                    <button
                      type="button"
                      onClick={() => handleDownloadReceipt(order)}
                      className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-400 hover:text-slate-950 transition cursor-pointer"
                    >
                      Receipt
                    </button>

                    <button
                      type="button"
                      onClick={() => saveOrder(order.id)}
                      disabled={savingId === order.id}
                      className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60 hover:bg-slate-200 transition cursor-pointer"
                    >
                      Save Order
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleDeleteOrder(order.id)}
                      disabled={savingId === order.id}
                      className="rounded-full border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500 hover:text-white transition disabled:opacity-50 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}

          {orders.length > visibleCount && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 5)}
                className="rounded-full border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/10 hover:text-white transition shadow-md cursor-pointer"
              >
                Show More (+5)
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default OrderManagement;