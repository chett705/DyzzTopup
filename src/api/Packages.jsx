import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
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
  const [showQrModal, setShowQrModal] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function loadGame() {
      try {
        setLoading(true);
        setError("");
        const data = await requestJson("/games");
        const games = Array.isArray(data?.data) ? data.data : [];
        const matchedGame = games.find((item) => 
          Number(item.id) === Number(id) || (item.api_game_id && Number(item.api_game_id) === Number(id))
        ) || null;

        if (!ignore) {
          setGame(matchedGame);
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
    return () => { ignore = true; };
  }, [id]);

  const sortedPackages = useMemo(() => {
    if (!game?.packages) return [];
    return [...game.packages].sort((a, b) => Number(a.diamond_amount) - Number(b.diamond_amount));
  }, [game]);

  useEffect(() => {
    if (sortedPackages.length) setSelectedPackage(String(sortedPackages[0].id));
  }, [sortedPackages]);

  const activePackage = useMemo(() => sortedPackages.find((pkg) => String(pkg.id) === String(selectedPackage)), [sortedPackages, selectedPackage]);
  const currentGameCode = (game?.code || "").toLowerCase();
  const showZoneInput = currentGameCode.includes("mlbb") || currentGameCode === "magic_chest_gogo" || currentGameCode === "la";

  async function handleCheckUsername() {
    try {
      setCheckingUsername(true); setUsernameError(""); setUsernameResult(null);
      const response = await requestJson("/check-username", {
        method: "POST",
        body: JSON.stringify({ game_code: currentGameCode, player_id: form.user_id.trim(), zone_id: form.server_id.trim() }),
      });
      const resData = response?.result?.data || response?.result || response;
      if (resData) setUsernameResult(resData); else throw new Error("Character not found.");
    } catch (err) { setUsernameError(err.message || "Verification Error."); } finally { setCheckingUsername(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!usernameResult || !acceptedTerms) return setError("Please complete required info and accept terms.");
    try {
      setSubmitting(true); setError("");
      const orderResponse = await requestJson("/orders", {
        method: "POST",
        body: JSON.stringify({ game_code: currentGameCode, package_id: Number(selectedPackage), player_id: form.user_id, player_username: usernameResult?.username || usernameResult?.player_name || "", zone_id: form.server_id, payment_method: "khqr" }),
      });
      const url = orderResponse?.checkout_url || orderResponse?.data?.checkout_url;
      if (url) { setPaymentUrl(url); setShowQrModal(true); }
    } catch (err) { setError(err.message || "Submission failed."); } finally { setSubmitting(false); }
  }

  return (
    <div className="min-h-screen bg-[#060913] text-white p-4 sm:p-6 lg:p-8 font-sans">
      <div className="mx-auto max-w-7xl">
        <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 mb-6">
          Back to games
        </Link>

        {loading ? <div className="text-slate-400">Loading game packages...</div> : !game ? <div className="text-rose-400">Game not found.</div> : (
          <div>
            {/* Banner Top */}
            <div className="overflow-hidden rounded-3xl border border-slate-900 bg-[#0d1527] mb-6 shadow-xl">
              <img src="/banner.png" alt="Game Banner" className="w-full h-auto max-h-[220px] object-cover" />
            </div>

            {/* Layout Grid Layout (ដូចរូបថតទី ២) */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 items-start">
              
              {/* Left Column (Forms & Selection) */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* 🎯 Game Header Title Card */}
                <section className="bg-[#0b1120] border border-slate-900 p-5 rounded-2xl flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs font-black uppercase text-cyan-400">
                    {game.code?.substring(0, 4)}
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-white">{game.name}</h1>
                    <p className="text-xs text-slate-400 mt-0.5">{game.packages?.length ?? 0} packages available</p>
                  </div>
                </section>

                {/* 🎯 Player Details Section */}
                <section className="bg-[#0b1120] border border-slate-900 p-5 rounded-2xl space-y-4">
                  <div>
                    <h3 className="font-bold text-base text-slate-100">Player details</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Fill the required info exactly as in your game account.</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-1.5">
                      <span className="text-xs font-semibold text-slate-400">User ID / Player ID</span>
                      <input value={form.user_id} onChange={(e) => setForm({...form, user_id: e.target.value})} className="bg-[#070b14] border border-slate-900 p-3 rounded-xl text-sm text-white outline-none focus:border-cyan-500/40" placeholder="702425515" />
                    </label>

                    {showZoneInput && (
                      <label className="grid gap-1.5">
                        <span className="text-xs font-semibold text-slate-400">Server / Zone ID</span>
                        <input value={form.server_id} onChange={(e) => setForm({...form, server_id: e.target.value})} className="bg-[#070b14] border border-slate-900 p-3 rounded-xl text-sm text-white outline-none focus:border-cyan-500/40" placeholder="10301" />
                      </label>
                    )}
                  </div>

                  {/* Check ID Status & Button Panel */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                    <div className="text-xs font-semibold">
                      {usernameResult && <span className="text-emerald-400 bg-emerald-500/5 px-3 py-1.5 rounded-xl border border-emerald-500/10">Name: {usernameResult.player_name || usernameResult.username}</span>}
                      {usernameError && <span className="text-rose-400 bg-rose-500/5 px-3 py-1.5 rounded-xl border border-rose-500/10">⚠️ {usernameError}</span>}
                    </div>
                    <button type="button" onClick={handleCheckUsername} className="self-end rounded-xl bg-[#18132b] border border-fuchsia-500/20 px-6 py-2.5 text-xs font-black text-fuchsia-400 transition hover:bg-[#221b3d]">
                      {checkingUsername ? "Checking..." : "CHECK ID"}
                    </button>
                  </div>
                </section>

                {/* 🎯 Packages Selection List */}
                <section className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                  {sortedPackages.map((pkg) => {
                    const isActive = String(pkg.id) === String(selectedPackage);
                    return (
                      <button key={pkg.id} onClick={() => setSelectedPackage(String(pkg.id))} className={`p-4 rounded-xl border text-left flex justify-between items-center transition-all ${isActive ? "border-cyan-400 bg-cyan-400/5 shadow-md shadow-cyan-500/5" : "border-slate-900 bg-[#0b1120] hover:border-slate-800"}`}>
                        <div>
                          <h4 className="font-bold text-xs sm:text-sm text-slate-200 truncate max-w-[160px]">{pkg.name}</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">{pkg.diamond_amount} diamonds</p>
                        </div>
                        <span className="text-[11px] font-black text-emerald-400 bg-emerald-500/5 px-2 py-1 rounded-md border border-emerald-500/10">${Number(pkg.price).toFixed(2)}</span>
                      </button>
                    );
                  })}
                </section>
              </div>

              {/* 🎯 Right Column: Checkout Block Panel (ស្ទីលដូចរូបថតទី ២) */}
              <aside className="bg-[#121824] border border-slate-900 p-5 rounded-2xl space-y-5 lg:sticky top-6">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold">BEFORE PAYMENT</p>
                  <h3 className="font-black text-lg text-white mt-1.5 truncate">{activePackage?.name || "No Selection"}</h3>
                  <p className="text-xs text-slate-400 mt-1">Review the package details, then confirm the terms to continue.</p>
                </div>

                <div className="bg-[#0b101b] border border-slate-900 p-4 rounded-xl">
                  <p className="text-[10px] uppercase text-slate-500 font-bold">TOTAL</p>
                  <div className="text-2xl font-black text-white mt-1">${Number(activePackage?.price || 0).toFixed(2)}</div>
                </div>

                <label className="flex gap-3 text-xs items-start cursor-pointer select-none bg-[#0b101b]/50 border border-slate-900/50 p-3 rounded-xl">
                  <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-0.5 rounded accent-cyan-500" />
                  <span className="text-slate-300 font-semibold leading-tight">I agree to <span className="text-white font-bold uppercase">Terms and Conditions</span></span>
                </label>

                {error && <div className="text-rose-400 text-xs bg-rose-500/5 p-3 rounded-xl border border-rose-500/10">{error}</div>}
                
                <button onClick={handleSubmit} disabled={submitting || !acceptedTerms} className="w-full flex items-center justify-between bg-[#9ca3af] disabled:bg-slate-700 text-slate-950 p-4 rounded-xl font-black uppercase tracking-wider text-xs transition active:scale-[0.99]">
                  <span>{submitting ? "Processing..." : "PAYMENT NOW"}</span>
                  <span className="bg-slate-950/10 px-2 py-0.5 rounded text-[9px] font-black">KHQR</span>
                </button>
              </aside>

            </div>
          </div>
        )}
      </div>

      {/* QR Code Modal Frame */}
      {showQrModal && paymentUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-[#0b1120] border border-slate-900 p-5 rounded-3xl w-full max-w-md text-center relative">
            <button onClick={() => setShowQrModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white font-bold">✕</button>
            <h3 className="text-base font-black mb-4 tracking-wide text-white">Scan to Pay (KHQR)</h3>
            <iframe src={paymentUrl} title="KHQR Web Interface" className="w-full h-[490px] bg-white rounded-2xl border-none" />
          </div>
        </div>
      )}
    </div>
  );
}

export default Packages;