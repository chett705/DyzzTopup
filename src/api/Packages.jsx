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
  const [form, setForm] = useState({ user_id: "", server_id: "" });
  const [submitting, setSubmitting] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameResult, setUsernameResult] = useState(null);
  const [usernameError, setUsernameError] = useState("");
  const [orderResult, setOrderResult] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // 🎯 Modal State សម្រាប់បង្ហាញ QR ក្នុងទំព័រតែមួយ
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadGame() {
      try {
        setLoading(true);
        setError("");
        const data = await requestJson("/games");
        const games = Array.isArray(data?.data) ? data.data : [];
        const matchedGame =
          games.find((item) => String(item.id) === String(id)) || null;

        if (!ignore) {
          setGame(matchedGame);
          setOrderResult(null);
          setPaymentResult(null);
          setPaymentUrl("");
          setAcceptedTerms(false);
          setShowQrModal(false);
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
  }, [id]);

  useEffect(() => {
    if (!game?.packages?.length) return;
    setSelectedPackage((current) => {
      if (current) {
        const exists = game.packages.some(
          (pkg) => String(pkg.id) === String(current),
        );
        if (exists) return current;
      }
      return String(game.packages[0].id);
    });
  }, [game]);

  const activePackage = useMemo(
    () =>
      game?.packages?.find((pkg) => String(pkg.id) === String(selectedPackage)),
    [game, selectedPackage],
  );

  const checkoutUrl = paymentResult?.checkout_url || paymentUrl;
  const packageCount = game?.packages?.length || 0;

  const usernameLabel = usernameResult?.name || usernameResult?.username || "-";
  const currentGameCode = (game?.code || "").toLowerCase();

  const priceLabel =
    activePackage?.price != null
      ? `$${Number(activePackage.price).toFixed(2)}`
      : "$0.00";

  const showZoneInput =
    currentGameCode === "mlbb" ||
    currentGameCode === "mcgg" ||
    currentGameCode === "la" ||
    currentGameCode === "lifeafter";

  async function handleCheckUsername() {
    if (!form.user_id.trim()) {
      setUsernameError("Please enter User ID first.");
      return;
    }

    if (showZoneInput && !form.server_id.trim()) {
      setUsernameError("Please complete required server/zone details.");
      return;
    }

    try {
      setCheckingUsername(true);
      setUsernameError("");
      setUsernameResult(null);

      let apiUrl = "";
      switch (currentGameCode) {
        case "mlbb":
          apiUrl = `https://api.isan.eu.org/nickname/ml?id=${encodeURIComponent(form.user_id.trim())}&zone=${encodeURIComponent(form.server_id.trim())}`;
          break;
        case "mcgg":
          apiUrl = `https://api.isan.eu.org/nickname/mcgg?id=${encodeURIComponent(form.user_id.trim())}&server=${encodeURIComponent(form.server_id.trim())}`;
          break;
        case "hok":
        case "honor_of_kings":
          apiUrl = `https://api.isan.eu.org/nickname/hok?id=${encodeURIComponent(form.user_id.trim())}`;
          break;
        case "aov":
          apiUrl = `https://api.isan.eu.org/nickname/aov?id=${encodeURIComponent(form.user_id.trim())}`;
          break;
        case "cod":
        case "codm":
          apiUrl = `https://api.isan.eu.org/nickname/cod?id=${encodeURIComponent(form.user_id.trim())}`;
          break;
        case "ff":
        case "freefire":
          apiUrl = `https://api.isan.eu.org/nickname/ff?id=${encodeURIComponent(form.user_id.trim())}`;
          break;
        default:
          apiUrl = "";
      }

      if (apiUrl) {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("Server connection failed.");
        const data = await response.json();
        const result = data?.data ?? data ?? {};

        if (!result?.name && !result?.username)
          throw new Error("Account not found.");

        setUsernameResult(result);
      } else {
        setUsernameResult({ name: "🎯 ID Formatted (Ready to top up)" });
      }
    } catch (err) {
      setUsernameError(err.message || "Unable to verify username.");
    } finally {
      setCheckingUsername(false);
    }
  }

  function openKhqrCheckout(customUrl) {
    const targetUrl = customUrl || checkoutUrl;
    if (!targetUrl) return;
    setShowQrModal(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedPackage) {
      setError("Please choose a package first.");
      return;
    }

    if (!acceptedTerms) {
      setError("Please accept the terms and conditions before payment.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setOrderResult(null);
      setPaymentResult(null);
      setPaymentUrl("");

      const payload = {
        game_code: currentGameCode,
        package_id: Number(selectedPackage),
        player_id: form.user_id,
        player_username: usernameResult?.name || usernameResult?.username || "",
        zone_id: form.server_id,
        payment_method: "khqr",
      };

      const orderResponse = await requestJson("/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const order =
        orderResponse?.order ??
        orderResponse?.data?.order ??
        orderResponse?.data ??
        orderResponse;
      setOrderResult(order);

      const nextCheckoutUrl =
        orderResponse?.checkout_url ||
        orderResponse?.data?.checkout_url ||
        order?.gateway_checkout_url;

      if (nextCheckoutUrl) {
        setPaymentResult({ checkout_url: nextCheckoutUrl });
        setPaymentUrl(nextCheckoutUrl);
        setShowQrModal(true);
      }
    } catch (err) {
      setError(err.message || "Order submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white relative">
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
        ) : !game ? (
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-200">
            Game not found.
          </div>
        ) : (
          <div>
            <div className="overflow-hidden mt-4 rounded-3xl border border-white/10 bg-white/5 shadow-lg shadow-black/20">
              <img
                src="/banner.png"
                alt={`${game.name} banner`}
                className="h-48 w-full object-cover sm:h-64 lg:h-80"
                loading="lazy"
              />
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-1">
              <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur flex flex-col justify-between">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex h-28 w-28 items-center justify-center rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/20 to-fuchsia-500/15 text-center shrink-0">
                    <span className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-100">
                      {game.code || "game"}
                    </span>
                  </div>
                  <div>
                    <h1 className="text-3xl font-black">{game.name}</h1>
                    <p className="mt-1 text-sm text-slate-400">
                      {packageCount} packages available
                    </p>
                  </div>
                </div>

                {/* 🧑‍💻 Form Player details */}
                <div className="my-6">
                  <form
                    onSubmit={handleSubmit}
                    className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur"
                  >
                    <h3 className="text-xl font-bold">Player details</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Fill the required info exactly as in your game account.
                    </p>

                    <div className="mt-5 grid gap-4">
                      <div
                        className={`grid gap-4 ${showZoneInput ? "sm:grid-cols-2" : "grid-cols-1"}`}
                      >
                        <label className="grid gap-2">
                          <span className="text-sm font-semibold text-slate-400">
                            User ID / Player ID
                          </span>
                          <input
                            value={form.user_id}
                            onChange={(e) => {
                              setForm({ ...form, user_id: e.target.value });
                              setUsernameResult(null);
                              setUsernameError("");
                            }}
                            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-cyan-400/60"
                            placeholder={
                              currentGameCode === "mlbb"
                                ? "702425515"
                                : "Enter ID"
                            }
                            required
                          />
                        </label>

                        {showZoneInput && (
                          <label className="grid gap-2">
                            <span className="text-sm font-semibold text-slate-400">
                              Server / Zone ID
                            </span>
                            <input
                              value={form.server_id}
                              onChange={(e) => {
                                setForm({ ...form, server_id: e.target.value });
                                setUsernameResult(null);
                                setUsernameError("");
                              }}
                              className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-cyan-400/60"
                              placeholder="10301"
                              required={showZoneInput}
                            />
                          </label>
                        )}
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {/* បង្ហាញឈ្មោះពេល Verify ជោគជ័យ ឬ បង្ហាញ Error Error ពេលរកមិនឃើញ */}
                        <div className="min-h-6 text-sm font-semibold">
                          {usernameResult && (
                            <span className="text-emerald-300">
                              Name : {usernameLabel}
                            </span>
                          )}
                          {usernameError && (
                            <span className="text-rose-400">
                              ⚠️ {usernameError}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={handleCheckUsername}
                          disabled={checkingUsername || !form.user_id.trim()}
                          className="inline-flex items-center justify-center rounded-full border border-fuchsia-400/30 bg-fuchsia-500/15 px-4 py-2 text-sm font-semibold text-fuchsia-100 transition hover:bg-fuchsia-500/25 disabled:opacity-50 cursor-pointer"
                        >
                          {checkingUsername ? "Checking..." : "CHECK ID"}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                {/* 💎 បញ្ជីកញ្ចប់តម្លៃ Diamonds */}
                <div className="grid grid-cols-2 gap-4 items-stretch">
                  {(game.packages || []).map((pkg) => {
                    const isActive = String(pkg.id) === String(selectedPackage);
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setSelectedPackage(String(pkg.id))}
                        className={`flex min-h-[120px] flex-col justify-between rounded-3xl border p-4 text-left transition-all duration-300 cursor-pointer ${
                          isActive
                            ? "border-cyan-400/50 bg-cyan-400/10 shadow-lg shadow-cyan-500/10"
                            : "border-white/10 bg-slate-950/40 hover:border-white/20 hover:bg-white/5"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2 w-full">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm sm:text-base font-bold text-white tracking-wide truncate">
                              {pkg.name}
                            </h3>
                            <p className="mt-1 text-[11px] sm:text-xs font-semibold text-slate-400">
                              {pkg.diamond_amount} diamonds
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[11px] font-black text-emerald-300 shadow-sm">
                            ${Number(pkg.price).toFixed(2)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* 📑 Sidebar Summary */}
              <aside className="space-y-6">
                <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/15 to-fuchsia-500/10 p-5">
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-xs uppercase tracking-[0.35em] text-cyan-200">
                      Before payment
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-white">
                      {activePackage?.name || "No package selected"}
                    </h2>
                    <p className="mt-2 text-sm text-slate-300">
                      Review the package details, then confirm the terms to continue.
                    </p>
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <p className="text-xs uppercase text-slate-400">Total</p>
                    <p className="mt-1 text-2xl font-black text-slate-300">
                      {priceLabel}
                    </p>
                  </div>

                  <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 transition hover:bg-white/10">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="h-5 w-5 rounded border-white/20 bg-slate-950 text-cyan-500 focus:ring-cyan-400"
                    />
                    <span className="text-sm font-semibold text-white">
                      I agree to{" "}
                      <span className="text-slate-300 uppercase tracking-[0.2em]">
                        Terms and Conditions
                      </span>
                    </span>
                  </label>

                  {error && (
                    <div className="mt-3 text-sm text-rose-400 font-semibold bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <button
                      type="submit"
                      disabled={submitting || !acceptedTerms}
                      className="mt-4 flex w-full items-center justify-between rounded-2xl bg-slate-400 px-4 py-4 font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span>{submitting ? "Payment..." : "Payment"}</span>
                      <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-black uppercase tracking-[0.25em]">
                        KHQR
                      </span>
                    </button>
                  </form>
                </div>
              </aside>
            </div>
          </div>
        )}
      </div>

      {/* 🎯 ផ្ទាំង MODAL OVERLAY បង្ហាញ KHQR ក្នុងទំព័រតែមួយ */}
      {showQrModal && checkoutUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-5">
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors text-xl font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
            <div className="text-center mb-4">
              <h3 className="text-xl font-black text-white">Scan to Pay</h3>
              <p className="text-xs text-slate-400 mt-1">
                Please scan the KHQR code below to complete payment.
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/5 bg-white h-[530px] w-full shadow-inner">
              <iframe
                src={checkoutUrl}
                title="KHQR Checkout Window"
                className="w-full h-full border-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Packages;
