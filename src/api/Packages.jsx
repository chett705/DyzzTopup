import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { getKhqrPaymentUrl, requestJson } from "./api";


function Packages() {
  const { id } = useParams();
  const location = useLocation();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [form, setForm] = useState({
    user_id: "",
    server_id: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameResult, setUsernameResult] = useState(null);
  const [usernameError, setUsernameError] = useState("");
  const [orderResult, setOrderResult] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [openingKhqr, setOpeningKhqr] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadGame() {
      try {
        setLoading(true);
        setError("");
        const routedGame = location.state?.game;

        if (routedGame && String(routedGame.id) === String(id)) {
          if (!ignore) setGame(routedGame);
          return;
        }

        const data = await requestJson("/games");
        const games = Array.isArray(data?.data) ? data.data : [];
        const matchedGame =
          games.find((item) => String(item.id) === String(id)) || null;

        if (!ignore) {
          setGame(matchedGame);
        }
      } catch (err) {
        if (!ignore) setError(err.message || "Unable to load packages.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadGame();

    return () => {
      ignore = true;
    };
  }, [id, location.state]);

  useEffect(() => {
    if (!game?.packages?.length) return;
    setSelectedPackage((current) => {
      if (current) {
        const exists = game.packages.some((pkg) => String(pkg.id) === String(current));
        if (exists) return current;
      }
      return String(game.packages[0].id);
    });
  }, [game]);

  useEffect(() => {
    setUsernameResult(null);
    setUsernameError("");
  }, [form.user_id, form.server_id]);

  const activePackage = useMemo(
    () => game?.packages?.find((pkg) => String(pkg.id) === String(selectedPackage)),
    [game, selectedPackage]
  );

  const paymentStatusLabel =
    paymentResult?.message ||
    (paymentResult?.success ? "KHQR generated successfully" : "Payment ready");

  const checkoutUrl = paymentResult?.checkout_url || paymentUrl;
  const packageCount = game?.packages?.length || 0;
  const usernameLabel = usernameResult?.username || usernameResult?.name || "-";

  async function handleCheckUsername() {
    if (!game?.code || !form.user_id.trim() || !form.server_id.trim()) {
      setUsernameError("Please enter both User ID and Server ID first.");
      setUsernameResult(null);
      return;
    }

    try {
      setCheckingUsername(true);
      setUsernameError("");
      setUsernameResult(null);

      const response = await fetch(
        `https://api.isan.eu.org/nickname/ml?id=${encodeURIComponent(form.user_id.trim())}&zone=${encodeURIComponent(form.server_id.trim())}`
      );

      if (!response.ok) {
        throw new Error("Server connection failed.");
      }

      const data = await response.json();
      const result = data?.data ?? data ?? {};

      if (!result?.name) {
        throw new Error("Account not found.");
      }

      setUsernameResult(result);
    } catch (err) {
      setUsernameError(err.message || "Unable to verify username.");
    } finally {
      setCheckingUsername(false);
    }
  }

  async function copyKhqr() {
    const value =
      paymentResult?.khqr_string ||
      paymentUrl ||
      JSON.stringify(paymentResult || {}, null, 2);

    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Ignore clipboard failures silently.
    }
  }

  async function loadKhqrPlugin() {
    if (window.KhqrPayway) return window.KhqrPayway;

    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector(
        'script[data-khqr-plugin="true"]'
      );

      if (existingScript) {
        existingScript.addEventListener("load", () => {
          if (window.KhqrPayway) resolve(window.KhqrPayway);
          else reject(new Error("KHQR plugin failed to initialize."));
        });
        existingScript.addEventListener("error", () =>
          reject(new Error("Failed to load KHQR plugin."))
        );
        return;
      }

      const script = document.createElement("script");
      script.src = "https://khqr.cc/khqrcc-plugin.js";
      script.async = true;
      script.dataset.khqrPlugin = "true";
      script.onload = () => {
        if (window.KhqrPayway) resolve(window.KhqrPayway);
        else reject(new Error("KHQR plugin failed to initialize."));
      };
      script.onerror = () => reject(new Error("Failed to load KHQR plugin."));
      document.body.appendChild(script);
    });
  }

  async function openKhqrCheckout(customUrl) {
    const targetUrl = customUrl || checkoutUrl;
    if (!targetUrl) return;

    setOpeningKhqr(true);

    try {
      const plugin = await loadKhqrPlugin();

      if (plugin?.openCheckout) {
        plugin.openCheckout({
          checkout_url: targetUrl,
          onSuccess(response) {
            setPaymentResult((current) => ({
              ...(current || {}),
              success: true,
              status: "success",
              gateway_response: response,
            }));
          },
          onError(error) {
            console.error("KHQR checkout error", error);
          },
        });
        return;
      }

      window.open(targetUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    } finally {
      setOpeningKhqr(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedPackage) {
      setError("Please choose a package first.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setOrderResult(null);
      setPaymentResult(null);
      setPaymentUrl("");

      const payload = {
        game_code: game?.code,
        package_id: Number(selectedPackage),
        player_id: form.user_id,
        zone_id: form.server_id,
        payment_method: "khqr",
      };

      const orderResponse = await requestJson("/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const order = orderResponse?.order ?? orderResponse?.data?.order ?? orderResponse?.data ?? orderResponse;
      setOrderResult(order);

      const orderId = order?.id ?? orderResponse?.order?.id ?? orderResponse?.data?.order?.id;
      const nextCheckoutUrl =
        order?.checkout_url ||
        orderResponse?.checkout_url ||
        orderResponse?.checkoutUrl ||
        order?.gateway_checkout_url ||
        orderResponse?.gateway_checkout_url ||
        getKhqrPaymentUrl(orderId);

      if (nextCheckoutUrl) {
        const normalizedPayment = {
          checkout_url: nextCheckoutUrl,
          status: order?.status || "pending",
          message: orderResponse?.message || "Order created. Open the KHQR checkout next.",
        };

        setPaymentResult(normalizedPayment);
        setPaymentUrl(nextCheckoutUrl);
        await openKhqrCheckout(nextCheckoutUrl);
      }
    } catch (err) {
      setError(err.message || "Order submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  const priceLabel =
    activePackage?.price != null
      ? `${Number(activePackage.price).toLocaleString()}`
      : "Price on request";
  const resolvedOrderNo = orderResult?.order_no || orderResult?.orderNo || "";

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
        >
          Back to games
        </Link>

        {loading ? (
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-300">
            Loading game packages...
          </div>
        ) : error && !game ? (
          <div className="mt-6 rounded-3xl border border-red-400/30 bg-red-500/10 p-6 text-red-100">
            <p className="font-semibold">Could not load this game</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        ) : !game ? (
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-200">
            <p className="font-semibold">Game not found</p>
            <p className="mt-1 text-sm">
              The selected game does not exist in the catalog returned by the API.
            </p>
          </div>
        ) : game ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-28 w-28 items-center justify-center rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/20 to-fuchsia-500/15 text-center">
                  <span className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-100">
                    {game.code || "game"}
                  </span>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">
                    Game shop
                  </p>
                  <h1 className="mt-2 text-3xl font-black">{game.name}</h1>
                  <p className="mt-2 max-w-2xl text-sm text-slate-300">
                    Choose a package below and fill in your player details.
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    {packageCount} packages available
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {(game.packages || []).map((pkg) => {
                  const isActive = String(pkg.id) === String(selectedPackage);
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setSelectedPackage(String(pkg.id))}
                      className={`rounded-3xl border p-4 text-left transition ${
                        isActive
                          ? "border-cyan-400/50 bg-cyan-400/10 shadow-lg shadow-cyan-500/10"
                          : "border-white/10 bg-slate-950/40 hover:border-white/20 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold text-white">
                            {pkg.name}
                          </h3>
                          <p className="mt-1 text-sm text-slate-400">
                            {pkg.diamond_amount} diamonds
                          </p>
                        </div>
                        <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                          {pkg.price}
                        </span>
                      </div>
                      <p className="mt-3 text-xs text-amber-200">
                        Package code: {game.code || "topup"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>

            <aside className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/15 to-fuchsia-500/10 p-5">
                <p className="text-xs uppercase tracking-[0.35em] text-cyan-200">
                  Selected package
                </p>
                <h2 className="mt-2 text-2xl font-bold">{activePackage?.name || "No package selected"}</h2>
                <p className="mt-1 text-sm text-slate-300">
                  {activePackage?.diamond_amount || 0} diamonds
                </p>
                <div className="mt-5 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                      Total
                    </p>
                    <p className="text-3xl font-black text-white">{priceLabel}</p>
                  </div>
                  {/* <Link
                    to="/orders"
                    className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
                  >
                    Track order
                  </Link> */}
                </div>
              </div>

              <form
                onSubmit={handleSubmit}
                className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur"
              >
                <h3 className="text-xl font-bold">Player details</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Fill the required info exactly as in your game account.
                </p>

                <div className="mt-5 grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                        User ID
                      </span>
                      <input
                        value={form.user_id}
                        onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                        className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none ring-0 placeholder:text-slate-500 focus:border-cyan-400/60"
                        placeholder="702425515"
                        required
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Server ID
                      </span>
                      <input
                        value={form.server_id}
                        onChange={(e) => setForm({ ...form, server_id: e.target.value })}
                        className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/60"
                        placeholder="10301"
                        required
                      />
                    </label>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-h-6 text-sm font-semibold text-emerald-300">
                      {usernameResult
                        ? `USERNAME: ${usernameLabel}`
                        : usernameError
                        ? usernameError
                        : " "}
                    </div>

                    <button
                      type="button"
                      onClick={handleCheckUsername}
                      disabled={checkingUsername}
                      className="inline-flex items-center justify-center rounded-full border border-fuchsia-400/30 bg-fuchsia-500/15 px-4 py-2 text-sm font-semibold text-fuchsia-100 transition hover:bg-fuchsia-500/25 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {checkingUsername ? "Checking..." : "CHECK ID"}
                    </button>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
                    <span className="font-semibold text-slate-200">Tip:</span>{" "}
                    For MLBB, enter the User ID and Server ID from the profile
                    page. We use those values to verify the account before checkout.
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-2xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-4 py-3 font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Creating order..." : "Create Order & Payment"}
                  </button>
                </div>
              </form>

              {orderResult ? (
                <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5 text-emerald-50">
                  <h3 className="font-bold">Order created</h3>
                  <p className="mt-2 text-sm text-emerald-100/90">
                    Order number:{" "}
                    <span className="font-semibold">
                      {resolvedOrderNo || "Pending"}
                    </span>
                  </p>
                  {resolvedOrderNo ? (
                    <Link
                      to={`/orders/${resolvedOrderNo}`}
                      className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950"
                    >
                      Open tracking page
                    </Link>
                  ) : null}
                </div>
              ) : null}

              {paymentResult ? (
                <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-cyan-200">
                        KHQR payment
                      </p>
                      <h3 className="mt-2 text-2xl font-bold text-white">
                        {paymentStatusLabel}
                      </h3>
                    </div>
                    <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                      {paymentResult?.status || "pending"}
                    </span>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    {checkoutUrl ? (
                      <button
                        type="button"
                        onClick={() => openKhqrCheckout()}
                        disabled={openingKhqr}
                        className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {openingKhqr ? "Opening KHQR..." : "Pay with KHQR"}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={copyKhqr}
                      className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
                    >
                      Copy KHQR
                    </button>
                  </div>

                  {paymentResult.message ? (
                    <p className="mt-4 text-sm text-cyan-50/90">
                      {paymentResult.message}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {!paymentResult && paymentUrl ? (
                <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5">
                  <h3 className="font-bold text-cyan-50">KHQR payment</h3>
                  <button
                    type="button"
                    onClick={openKhqrCheckout}
                    disabled={openingKhqr}
                    className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {openingKhqr ? "Opening KHQR..." : "Pay with KHQR"}
                  </button>
                </div>
              ) : null}
            </aside>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default Packages;

