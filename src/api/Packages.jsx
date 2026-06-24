import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Seo from "../components/Seo";
import { requestJson } from "./api";

function Packages() {
  const { id } = useParams();

  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [form, setForm] = useState({ user_id: "", server_id: "" });
  const [submitting, setSubmitting] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameResult, setUsernameResult] = useState(null);
  const [usernameError, setUsernameError] = useState("");
  const [paymentResult, setPaymentResult] = useState(null);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [showQrModal, setShowQrModal] = useState(false);
  
  // 🎯 State សម្រាប់គ្រប់គ្រងផ្ទាំង Alert ជូនដំណឹងពី Weekly Diamond Pass (Show One Time per session)
  const [weeklyAlertDismissed, setWeeklyAlertDismissed] = useState(false);

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

  // 🎯 តម្រៀបកញ្ចប់ពេជ្រពីតូចទៅធំ (Small to Big) ផ្អែកលើ diamond_amount
  const sortedPackages = useMemo(() => {
    if (!game?.packages) return [];
    return [...game.packages].sort((a, b) => {
      return Number(a.diamond_amount) - Number(b.diamond_amount);
    });
  }, [game]);

  // 🎯 ឆែកលក្ខខណ្ឌលោត Alert Weekly Pass សម្រាប់តែខ្សែហ្គេម MLBB 

  const selectedPackageId = useMemo(() => {
    if (!sortedPackages.length) return null;
    if (selectedPackage) {
      const exists = sortedPackages.some(
        (pkg) => String(pkg.id) === String(selectedPackage),
      );
      if (exists) return String(selectedPackage);
    }
    return String(sortedPackages[0].id);
  }, [sortedPackages, selectedPackage]);

  const isMlbbGame = (game?.code || "").toLowerCase().includes("mlbb");
  const showWeeklyAlert =
    Boolean(game) &&
    isMlbbGame &&
    !weeklyAlertDismissed &&
    !sessionStorage.getItem(`seen_weekly_alert_${id}`);

  const handleCloseWeeklyAlert = () => {
    sessionStorage.setItem(`seen_weekly_alert_${id}`, "true");
    setWeeklyAlertDismissed(true);
  };

  const activePackage = useMemo(
    () =>
      sortedPackages.find((pkg) => String(pkg.id) === String(selectedPackageId)),
    [sortedPackages, selectedPackageId],
  );

  const checkoutUrl = paymentResult?.checkout_url || paymentUrl;
  const packageCount = game?.packages?.length || 0;
  const pageTitle = game?.name ? `${game.name} Top Up` : "Game Packages";
  const pageDescription = game?.name
    ? `Choose ${game.name} diamond top up packages in Cambodia with secure KHQR payment and fast delivery.`
    : "Browse game top up packages in Cambodia with secure KHQR payment and fast delivery.";

  const usernameLabel = usernameResult?.player_name || usernameResult?.username || usernameResult?.name || usernameResult?.account_name || "-";
  const currentGameCode = (game?.code || "").toLowerCase();

  const priceLabel =
    activePackage?.price != null
      ? `$${Number(activePackage.price).toFixed(2)}`
      : "$0.00";

  // ឆែកបង្ហាញប្រអប់ Server / Zone ID សម្រាប់គ្រប់ខ្សែ MLBB
  const showZoneInput =
    currentGameCode.includes("mlbb") ||
    currentGameCode === "magic_chest_gogo" ||
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

      const response = await requestJson("/mlbb/check-id", {
        method: "POST",
        body: JSON.stringify({
          game_code: currentGameCode,
          player_id: form.user_id.trim(),
          zone_id: form.server_id.trim(),
        }),
      });

      const resData = response?.result?.data || response?.result || response;

      if (resData) {
        setUsernameResult(resData);
      } else {
        throw new Error("Character not found. Please check your ID.");
      }
    } catch (err) {
      console.error("Verification Error Detailed:", err);
      let detailedError = "Unable to verify username.";
      if (err.response?.data) {
        detailedError = typeof err.response.data === 'object' ? JSON.stringify(err.response.data) : String(err.response.data);
      } else if (err.data) {
        detailedError = typeof err.data === 'object' ? JSON.stringify(err.data) : String(err.data);
      } else if (err.message) {
        detailedError = err.message;
      } else {
        detailedError = JSON.stringify(err);
      }
      setUsernameError(detailedError);
    } finally {
      setCheckingUsername(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    // 🎯 ប្រព័ន្ធការពារ (Validation) បង្ខំឱ្យវាយ ID និងចុច Check ID មុនពេលបង់លុយ
    if (!form.user_id.trim()) {
      setError("សូមបំពេញ User ID / Player ID របស់បងជាមុនសិន! (Please enter User ID first.)");
      return;
    }

    if (showZoneInput && !form.server_id.trim()) {
      setError("សូមបំពេញ Server / Zone ID របស់បងជាមុនសិន! (Please enter Server ID.)");
      return;
    }

    if (!usernameResult) {
      setError("សូមចុចប៊ូតុង 'CHECK ID' ដើម្បីផ្ទៀងផ្ទាត់ឈ្មោះគណនីហ្គេមរបស់បងជាមុនសិន! (Please check ID first.)");
      return;
    }

    if (!selectedPackageId) {
      setError("សូមជ្រើសរើសកញ្ចប់ពេជ្រដែលបងចង់ទិញ! (Please choose a package first.)");
      return;
    }

    if (!acceptedTerms) {
      setError("Please accept the terms and conditions before payment.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setPaymentResult(null);
      setPaymentUrl("");

      const payload = {
        game_code: currentGameCode,
        package_id: Number(selectedPackageId),
        player_id: form.user_id,
        player_username: usernameResult?.username || usernameResult?.name || usernameResult?.player_name || "",
        zone_id: form.server_id,
        payment_method: "khqr",
      };

      const orderResponse = await requestJson("/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const nextCheckoutUrl =
        orderResponse?.checkout_url ||
        orderResponse?.data?.checkout_url ||
        orderResponse?.order?.gateway_checkout_url;

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
      <Seo
        title={pageTitle}
        description={pageDescription}
        canonicalPath={`/games/${id}`}
        image="/banner.png"
        keywords={`${game?.name || "game"} top up, diamond top up, khqr payment, dyzz store`}
        schema={
          game
            ? {
                "@context": "https://schema.org",
                "@type": "Product",
                name: game.name,
                description: pageDescription,
                brand: {
                  "@type": "Brand",
                  name: "Dyzz Store",
                },
                offers: {
                  "@type": "Offer",
                  priceCurrency: "USD",
                  price: activePackage?.price != null ? Number(activePackage.price).toFixed(2) : undefined,
                  availability: "https://schema.org/InStock",
                },
              }
            : null
        }
      />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 pb-32">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
        >
          Back to games
        </Link>

        {loading ? (
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-300 animate-pulse">
            Loading game packages...
          </div>
        ) : !game ? (
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-200">
            Game not found.
          </div>
        ) : (
          <div>
            {/* Banner Section */}
            <div className="overflow-hidden mt-4 rounded-3xl border border-white/10 bg-white/5 shadow-lg shadow-black/20">
              <img
                src="/banner.png"
                alt={`${game.name} banner`}
                className="h-40 w-full object-cover sm:h-56 lg:h-72"
                loading="lazy"
              />
            </div>

            {/* Layout Grid */}
            <div className="mt-6 grid gap-6 grid-cols-1 lg:grid-cols-3 items-start">
              
              {/* Left Side (Form & Packages) */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Game Header */}
                <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur flex flex-col gap-4 sm:flex-row sm:items-center">
                  
                  {/* 🎯 រៀបចំ CSS ឱ្យអក្សរ MLBB_EXCLUSIVE រត់ Fit ក្នុងប្រអប់ការ៉េ */}
                  <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/20 to-fuchsia-500/15 text-center shrink-0 p-2 overflow-hidden">
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-cyan-100 break-words max-w-full block leading-tight">
                      {game.code || "game"}
                    </span>
                  </div>

                  <div>
                    <h1 className="text-2xl sm:text-3xl font-black">{game.name}</h1>
                    <p className="mt-1 text-xs sm:text-sm text-slate-400">
                      {packageCount} packages available
                    </p>
                  </div>
                </section>

                {/* Player details form */}
                <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                  <h3 className="text-lg sm:text-xl font-bold">Player details</h3>
                  <p className="mt-1 text-xs sm:text-sm text-slate-400">
                    Fill the required info exactly as in your game account.
                  </p>

                  <div className="mt-5 grid gap-4">
                    <div className={`grid gap-4 ${showZoneInput ? "sm:grid-cols-2" : "grid-cols-1"}`}>
                      <label className="grid gap-2">
                        <span className="text-sm font-semibold text-slate-400">User ID / Player ID</span>
                        <input
                          value={form.user_id}
                          onChange={(e) => {
                            setForm({ ...form, user_id: e.target.value });
                            setUsernameResult(null);
                            setUsernameError("");
                          }}
                          className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-cyan-400/60 transition"
                          placeholder={currentGameCode.includes("mlbb") ? "702425515" : "Enter ID"}
                          required
                        />
                      </label>

                      {showZoneInput && (
                        <label className="grid gap-2">
                          <span className="text-sm font-semibold text-slate-400">Server / Zone ID</span>
                          <input
                            value={form.server_id}
                            onChange={(e) => {
                              setForm({ ...form, server_id: e.target.value });
                              setUsernameResult(null);
                              setUsernameError("");
                            }}
                            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-cyan-400/60 transition"
                            placeholder="10301"
                            required={showZoneInput}
                          />
                        </label>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-2">
                      <div className="min-h-6 text-sm font-semibold flex-1">
                        {usernameResult && (
                          <span className="text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl inline-block">
                            Name : {usernameLabel}
                          </span>
                        )}
                        {usernameError && (
                          <span className="text-rose-400 block max-w-lg break-all bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl">
                            ⚠️ {usernameError}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleCheckUsername}
                        disabled={checkingUsername || !form.user_id.trim()}
                        className="inline-flex items-center justify-center rounded-2xl border border-fuchsia-400/30 bg-fuchsia-500/15 px-5 py-3 text-sm font-semibold text-fuchsia-100 transition hover:bg-fuchsia-500/25 disabled:opacity-50 cursor-pointer active:scale-95"
                      >
                        {checkingUsername ? "Checking..." : "CHECK ID"}
                      </button>
                    </div>
                  </div>
                </section>

                {/* Packages Selection Grid (រៀបដេញតាម sortedPackages ពីតូចទៅធំ) */}
                <section className="grid grid-cols-2 gap-3 sm:gap-4 items-stretch">
                  {sortedPackages.map((pkg) => {
                    const isActive = String(pkg.id) === String(selectedPackageId);
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setSelectedPackage(String(pkg.id))}
                        className={`flex min-h-[110px] flex-col justify-between rounded-3xl border p-4 text-left transition-all duration-300 cursor-pointer active:scale-95 ${
                          isActive
                            ? "border-cyan-400/60 bg-cyan-400/10 shadow-lg shadow-cyan-500/10"
                            : "border-white/10 bg-slate-950/40 hover:border-white/20 hover:bg-white/5"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2 w-full">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xs sm:text-sm font-bold text-slate-100 tracking-wide truncate">
                              {pkg.name}
                            </h3>
                            <p className="mt-1 text-[10px] sm:text-xs font-semibold text-slate-400">
                              {pkg.diamond_amount} diamonds
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] sm:text-[11px] font-black text-emerald-300 shadow-sm">
                            ${Number(pkg.price).toFixed(2)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </section>
              </div>

              {/* Right Side (Summary Card) */}
              <aside className="space-y-6 lg:col-span-1">
                <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/15 to-fuchsia-500/10 p-5 sticky top-6">
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-xs uppercase tracking-[0.35em] text-cyan-200">Before payment</p>
                    <h2 className="mt-2 text-xl sm:text-2xl font-bold text-white truncate">
                      {activePackage?.name || "No package selected"}
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm text-slate-300">
                      Review the package details, then confirm the terms to continue.
                    </p>
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <p className="text-xs uppercase text-slate-400">Total</p>
                    <p className="mt-1 text-xl sm:text-2xl font-black text-slate-300">{priceLabel}</p>
                  </div>

                  <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 transition hover:bg-white/10 select-none">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="h-5 w-5 mt-0.5 rounded border-white/20 bg-slate-950 text-cyan-500 focus:ring-cyan-400 shrink-0"
                    />
                    <span className="text-xs sm:text-sm font-semibold text-slate-200 leading-tight">
                      I agree to <span className="text-slate-300 uppercase tracking-[0.1em] font-bold">Terms and Conditions</span>
                    </span>
                  </label>

                  {error && (
                    <div className="mt-3 text-xs sm:text-sm text-rose-400 font-semibold bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl break-words">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <button
                      type="submit"
                      disabled={submitting || !acceptedTerms}
                      className="mt-4 flex w-full items-center justify-between rounded-2xl bg-white hover:bg-slate-200 px-4 py-4 font-bold text-slate-950 shadow-lg shadow-cyan-500/5 transition disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer active:scale-[0.98]"
                    >
                      <span className="text-sm sm:text-base">{submitting ? "Processing..." : "PAYMENT NOW"}</span>
                      <span className="rounded-full bg-slate-950/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.25em]">KHQR</span>
                    </button>
                  </form>
                </div>
              </aside>

            </div>
          </div>
        )}
      </div>

      {/* QR Code Modal Box */}
      {showQrModal && checkoutUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 sm:p-6">
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-center">
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

            <div className="overflow-hidden rounded-2xl border border-white/5 bg-white h-[480px] sm:h-[520px] w-full shadow-inner relative">
              <iframe src={checkoutUrl} title="KHQR Checkout Window" className="w-full h-full border-none" />
            </div>
          </div>
        </div>
      )}

      {/* 🎯 ផ្ទាំង ALERT POP-UP សេចក្តីជូនដំណឹងអំពី WEEKLY DIAMOND PASS (Show One Time per Session) */}
     {showWeeklyAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            
            {/* Header ផ្ទាំងប្រកាស */}
            <div className="text-center mb-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-500/10 border border-fuchsia-400/20 mb-2">
                <span className="text-xl">👑</span>
              </div>
              <h3 className="text-lg font-black text-white tracking-wide">Weekly Diamond Pass Notice</h3>
            </div>

            {/* បញ្ជីលក្ខខណ្ឌច្បាប់ផ្អែកលើរូបភាព image_c22d7d.png */}
            <div className="space-y-3.5 text-slate-200 text-xs sm:text-sm bg-slate-950/50 border border-white/5 p-4 rounded-2xl leading-relaxed mb-5">
              <p className="font-medium">
                1. សូមបញ្ជាក់ថា អាខោនរបស់អ្នក <span className="text-fuchsia-400 font-bold">Level 5 ឡើង</span> ទើបអាចទិញបាន។
              </p>
              <p className="font-medium">
                2. សូមបញ្ជាក់ថា បើអាខោនរបស់អ្នកមាន Weekly Diamond Pass ហើយ អ្នកអាចទិញបានលុះត្រាតែ Weekly Diamond Pass របស់អ្នក<span className="text-cyan-400 font-bold">នៅសល់ក្រោម 70 ថ្ងៃ</span>។
              </p>
            </div>

            {/* ផ្នែកបន្ថែមរំលឹកពី Diamond Amount */}
            <div className="p-3 rounded-xl border border-cyan-500/10 bg-cyan-500/5 text-[11px] sm:text-xs text-slate-400 mb-5 leading-tight">
              💡 <span className="text-slate-300 font-semibold">ព័ត៌មានកញ្ចប់៖</span> ទទួលបាន 80 Diamonds ភ្លាមៗ និង 20 Diamonds ប្រចាំថ្ងៃរយៈពេល ៧ ថ្ងៃ (សរុប ២២០ គ្រាប់)។
            </div>

            {/* ប៊ូតុងយល់ព្រមបិទផ្ទាំង */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowWeeklyAlert(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                បិទ
              </button>
              <button
                onClick={handleCloseWeeklyAlert}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-400 hover:to-pink-400 text-white text-xs font-bold shadow-lg shadow-fuchsia-500/20 transition active:scale-[0.98] cursor-pointer"
              >
                យល់ព្រម
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default Packages;
