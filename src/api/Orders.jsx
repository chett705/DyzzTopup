import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { requestJson } from "./api";

function Orders() {
  const params = useParams();
  const navigate = useNavigate();
  const [orderNo, setOrderNo] = useState(params.orderNo || "");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const skipNextAutoFetchRef = useRef(false);

  useEffect(() => {
    if (params.orderNo) {
      setOrderNo(params.orderNo);
      if (skipNextAutoFetchRef.current) {
        skipNextAutoFetchRef.current = false;
        return;
      }
      void fetchOrder(params.orderNo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.orderNo]);

  async function fetchOrder(value) {
    const nextOrderNo = value.trim();
    if (!nextOrderNo) return;

    try {
      setLoading(true);
      setError("");
      const data = await requestJson(`/orders/${encodeURIComponent(nextOrderNo)}`);
      setOrder(data?.data ?? data);
      if (params.orderNo !== nextOrderNo) {
        skipNextAutoFetchRef.current = true;
        navigate(`/orders/${encodeURIComponent(nextOrderNo)}`, { replace: true });
      }
    } catch (err) {
      setOrder(null);
      setError(err.message || "Unable to track this order.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await fetchOrder(orderNo);
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/"
          className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
        >
          Back to shop
        </Link>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">
            Order tracking
          </p>
          <h1 className="mt-2 text-3xl font-black">Check your order status</h1>
          <p className="mt-2 text-sm text-slate-400">
            Enter the numeric order ID returned by the API after checkout.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              value={orderNo}
              onChange={(e) => setOrderNo(e.target.value)}
              placeholder="Order ID"
              className="flex-1 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/60"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-5 py-3 font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Searching..." : "Track Order"}
            </button>
          </form>

          {error ? (
            <div className="mt-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-red-100">
              {error}
            </div>
          ) : null}
        </section>

        {order ? (
          <section className="mt-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-emerald-200">
                  Status
                </p>
                <h2 className="mt-2 text-2xl font-bold">
                  {order.order_status || order.status || "Pending"}
                </h2>
                <p className="mt-2 text-sm text-emerald-50/90">
                  Order number: {order.order_no || order.orderNo || "-"}
                </p>
              </div>

              <Link
                to={order.topup_game_id ? `/games/${order.topup_game_id}` : "/"}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950"
              >
                Back to package
              </Link>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <DetailCard label="Order No" value={order.order_no || "-"} />
              <DetailCard label="Player ID" value={order.player_id || "-"} />
              <DetailCard label="Zone ID" value={order.zone_id || "-"} />
              <DetailCard
                label="Package"
                value={order.package?.name || order.package_name || order.package_id || "-"}
              />
              <DetailCard
                label="Payment"
                value={order.payment?.status || order.payment_status || "-"}
              />
              <DetailCard label="Amount" value={order.amount != null ? order.amount : "-"} />
            </div>

            {order.payment?.khqr_string ? (
              <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  KHQR
                </p>
                <p className="mt-2 break-words text-sm text-slate-100">
                  {order.payment.khqr_string}
                </p>
              </div>
            ) : null}

            {order.message ? (
              <p className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-100">
                {order.message}
              </p>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  );
}

function DetailCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

export default Orders;
