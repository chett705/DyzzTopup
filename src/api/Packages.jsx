import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { getKhqrPaymentUrl, requestJson } from "./api";
import Swal from "sweetalert2";

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

  useEffect(() => {
    setUsernameResult(null);
    setUsernameError("");
  }, [form.user_id, form.server_id]);

  const activePackage = useMemo(
    () =>
      game?.packages?.find((pkg) => String(pkg.id) === String(selectedPackage)),
    [game, selectedPackage],
  );

  const checkoutUrl = paymentResult?.checkout_url || paymentUrl;
  const packageCount = game?.packages?.length || 0;
  const usernameLabel = usernameResult?.username || usernameResult?.name || "-";
  const currentGameCode = (game?.code || "").toLowerCase();
  
  // 🎯 បន្ថែមការប្រកាស Label តម្លៃដែលខ្វះ ការពារការបាក់កូដងងឹតអេក្រង់
  const priceLabel = activePackage?.price != null
    ? `$${Number(activePackage.price).toFixed(2)}`
    : "$0.00";

  const showZoneInput = 
    currentGameCode === "mlbb" || 
    currentGameCode === "mcgg" || 
    currentGameCode === "la" || 
    currentGameCode === "lifeafter";

  async function handleCheckUsername() {
    if (!form.user_id.trim()) {
      Swal.fire({ icon: "warning", title: "Missing Info", text: "Please enter User ID first.", confirmButtonColor: "#06b6d4" });
      return;
    }

    if (showZoneInput && !form.server_id.trim()) {
      Swal.fire({ icon: "warning", title: "Missing Info", text: "Please complete required server/zone details.", confirmButtonColor: "#06b6d4" });
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

        if (!result?.name && !result?.username) throw new Error("Account not found.");
        
        // ✅ រក្សាទុកឈ្មោះចូល State ស្វ័យប្រវត្តនៅត្រង់នេះ
        setUsernameResult(result);

        Swal.fire({
          icon: "success",
          title: "Account Verified!",
          html: `<p class="text-base font-semibold">Player Name: <span class="text-cyan-400 font-bold">${result.name || result.username}</span></p>`,
          confirmButtonColor: "#06b6d4",
        });
      } else {
        setUsernameResult({ name: "🎯 Account Verified (Ready to top up)" });
        Swal.fire({ icon: "success", title: "ID Formatted", text: "Ready to top up.", confirmButtonColor: "#06b6d4" });
      }
    } catch (err) {
      setUsernameError(err.message || "Unable to verify username.");
      Swal.fire({ icon: "error", title: "Verification Failed", text: err.message, confirmButtonColor: "#ef4444" });
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

    try {
      setSubmitting(true);
      setError("");
      setOrderResult(null); // ✅ ដំណោះស្រាយ៖ លុបសញ្ញា $ ចេញដើម្បីកុំឱ្យគាំងកូដ
      setPaymentResult(null);
      setPaymentUrl("");

      const payload = {
        game_code: currentGameCode,
        package_id: Number(selectedPackage),
        player_id: form.user_id,
        
        // 🎯 ចាប់យកឈ្មោះហ្គេមដែលបានមកពីការ Check ID បាញ់ទៅកាន់ Laravel
        player_username: usernameResult?.name || usernameResult?.username || "",
        zone_id: form.server_id,
        payment_method: "khqr",
      };

      const orderResponse = await requestJson("/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const order = orderResponse?.order ?? orderResponse?.data?.order ?? orderResponse?.data ?? orderResponse;
      setOrderResult(order);

      const nextCheckoutUrl = orderResponse?.checkout_url || orderResponse?.data?.checkout_url || order?.gateway_checkout_url;

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
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
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
                    <div className={`grid gap-4 ${showZoneInput ? "sm:grid-cols-2" : "grid-cols-1"}`}>
                      <label className="grid gap-2">
                        <span className="text-sm font-semibold text-slate-400">User ID / Player ID</span>
                        <input
                          value={form.user_id}
                          onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                          className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-cyan-400/60"
                          placeholder={currentGameCode === "mlbb" ? "702425515" : "Enter ID"}
                          required
                        />
                      </label>

                      {showZoneInput && (
                        <label className="grid gap-2">
                          <span className="text-sm font-semibold text-slate-400">Server / Zone ID</span>
                          <input
                            value={form.server_id}
                            onChange={(e) => setForm({ ...form, server_id: e.target.value })}
                            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-cyan-400/60"
                            placeholder="10301"
                            required={showZoneInput}
                          />
                        </label>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-h-6 text-sm font-semibold text-emerald-300">
                        {usernameResult ? `VERIFIED: ${usernameLabel}` : " "}
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
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 items-stretch">
                {(game.packages || []).map((pkg) => {
                  const isActive = String(pkg.id) === String(selectedPackage);
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setSelectedPackage(String(pkg.id))}
                      className={`rounded-3xl border p-4 text-left transition-all duration-300 flex flex-col justify-between min-h-[110px] cursor-pointer ${
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
                <p className="text-xs uppercase tracking-[0.35em] text-cyan-200">
                  Selected package
                </p>
                <h2 className="mt-2 text-2xl font-bold">
                  {activePackage?.name || "No package selected"}
                </h2>
                <div className="mt-5 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase text-slate-400">Total</p>
                    <p className="text-3xl font-black text-white">
                      {priceLabel}
                    </p>
                  </div>
                </div>
                <form onSubmit={handleSubmit}>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-4 py-3 font-semibold text-white transition hover:brightness-110 disabled:opacity-60 w-full hover:cursor-pointer"
                  >
                    {submitting ? "Creating order..." : "Create Order & Payment"}
                  </button>
                </form>
              </div>
            </aside>
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
              <p className="text-xs text-slate-400 mt-1">Please scan the KHQR code below to complete payment.</p>
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