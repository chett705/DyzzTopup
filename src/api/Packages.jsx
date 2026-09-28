import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { requestJson } from "./api";

const PKG_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap');

  .pk { min-height:100vh; background:#07081a; color:#fff; font-family:'Outfit',sans-serif; position:relative; overflow-x:hidden; }

  /* blobs */
  .pk-blob { position:fixed; border-radius:50%; filter:blur(130px); pointer-events:none; z-index:0; }
  .pk-blob-1 { width:600px;height:600px; background:radial-gradient(circle,rgba(120,40,220,0.2) 0%,transparent 70%); top:-160px;left:-100px; animation:pkFloat 13s ease-in-out infinite alternate; }
  .pk-blob-2 { width:480px;height:480px; background:radial-gradient(circle,rgba(0,210,255,0.12) 0%,transparent 70%); top:40%;right:-100px; animation:pkFloat 9s ease-in-out infinite alternate-reverse; }
  .pk-blob-3 { width:380px;height:380px; background:radial-gradient(circle,rgba(220,40,255,0.11) 0%,transparent 70%); bottom:0;left:30%; animation:pkFloat 15s ease-in-out infinite alternate; }
  @keyframes pkFloat { from{transform:translate(0,0) scale(1)} to{transform:translate(26px,34px) scale(1.07)} }

  /* container */
  .pk-wrap { position:relative;z-index:1;max-width:1200px;margin:0 auto;padding:20px 16px 70px; }

  /* back button */
  .pk-back { display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:#64748b;border:1px solid rgba(255,255,255,.08);border-radius:100px;padding:7px 16px;margin-bottom:20px;transition:all .22s; }
  .pk-back:hover { color:#c084fc;border-color:rgba(168,85,247,.3);background:rgba(168,85,247,.06); }

  /* hero */
  .pk-hero { position:relative;border-radius:22px;overflow:hidden;border:1px solid rgba(168,85,247,.2);box-shadow:0 0 60px rgba(100,30,200,.18);margin-bottom:28px; }
  .pk-hero img { width:100%;height:auto;max-height:240px;object-fit:cover;display:block; }
  .pk-hero-ov { position:absolute;inset:0;background:linear-gradient(to top,rgba(7,8,26,.7) 0%,transparent 55%); }

  /* layout */
  .pk-layout { display:grid;gap:24px;grid-template-columns:1fr; }
  @media(min-width:1024px){ .pk-layout { grid-template-columns:1fr 340px; } }

  /* section card */
  .pk-section { background:rgba(255,255,255,.03);border:1px solid rgba(168,85,247,.12);border-radius:20px;padding:22px; }

  /* game header */
  .pk-game-hd { display:flex;align-items:center;gap:14px; }
  .pk-game-icon { width:56px;height:56px;border-radius:14px;background:linear-gradient(135deg,rgba(168,85,247,.2),rgba(0,229,255,.1));border:1px solid rgba(168,85,247,.28);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 0 24px rgba(168,85,247,.12); }
  .pk-game-icon-txt { font-size:14px;font-weight:900;letter-spacing:-.01em;background:linear-gradient(135deg,#c084fc,#00e5ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text; }
  .pk-game-name { font-size:20px;font-weight:900;margin:0 0 3px; }
  .pk-game-sub { font-size:12px;color:#475569;margin:0; }

  /* player section label */
  .pk-label-hd { font-size:15px;font-weight:800;color:#e2e8f0;margin:0 0 3px; }
  .pk-label-sub { font-size:12px;color:#475569;margin:0 0 16px; }

  /* inputs grid */
  .pk-input-grid { display:grid;gap:14px; }
  @media(min-width:480px){ .pk-input-grid { grid-template-columns:1fr 1fr; } }
  .pk-field { display:grid;gap:6px; }
  .pk-field-label { font-size:11px;font-weight:700;letter-spacing:.08em;color:#64748b;text-transform:uppercase; }
  .pk-input { background:rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:11px 14px;font-size:14px;font-family:inherit;color:#fff;outline:none;transition:border-color .2s,box-shadow .2s;width:100%; }
  .pk-input::placeholder { color:#334155; }
  .pk-input:focus { border-color:rgba(168,85,247,.4);box-shadow:0 0 0 3px rgba(168,85,247,.08); }

  /* check row */
  .pk-check-row { display:flex;flex-direction:column;gap:10px;margin-top:14px; }
  @media(min-width:520px){ .pk-check-row { flex-direction:row;align-items:center;justify-content:space-between; } }
  .pk-username-ok { font-size:12px;font-weight:700;color:#34d399;background:rgba(52,211,153,.07);padding:6px 14px;border-radius:10px;border:1px solid rgba(52,211,153,.15); }
  .pk-username-err { font-size:12px;font-weight:700;color:#f87171;background:rgba(248,113,113,.07);padding:6px 14px;border-radius:10px;border:1px solid rgba(248,113,113,.15); }
  .pk-check-btn { align-self:flex-end;background:linear-gradient(135deg,rgba(168,85,247,.18),rgba(0,229,255,.08));border:1px solid rgba(168,85,247,.3);border-radius:12px;padding:9px 20px;font-size:11px;font-weight:900;font-family:inherit;letter-spacing:.18em;color:#c084fc;cursor:pointer;text-transform:uppercase;transition:all .22s;white-space:nowrap; }
  .pk-check-btn:hover { background:linear-gradient(135deg,rgba(168,85,247,.28),rgba(0,229,255,.14));border-color:rgba(168,85,247,.5);color:#e0aaff; }
  .pk-check-btn:active { transform:scale(.97); }

  /* packages grid */
  .pk-pkg-grid { display:grid;gap:12px;grid-template-columns:1fr; }
  @media(min-width:500px){ .pk-pkg-grid { grid-template-columns:1fr 1fr; } }

  .pk-pkg { display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-radius:14px;border:1px solid rgba(168,85,247,.12);background:rgba(10,6,24,.7);cursor:pointer;transition:all .24s;text-align:left; font-family:inherit; width:100%; }
  .pk-pkg:hover { border-color:rgba(168,85,247,.32);background:rgba(20,10,48,.8); }
  .pk-pkg.active { border-color:rgba(0,229,255,.45);background:linear-gradient(135deg,rgba(0,229,255,.06),rgba(168,85,247,.07));box-shadow:0 0 28px rgba(0,229,255,.08),0 0 0 1px rgba(0,229,255,.12); }
  .pk-pkg-name { font-size:13px;font-weight:800;color:#cbd5e1;margin:0 0 3px;text-overflow:ellipsis;overflow:hidden;white-space:nowrap;max-width:160px; }
  .pk-pkg.active .pk-pkg-name { color:#e0f2fe; }
  .pk-pkg-diamonds { font-size:11px;color:#475569;margin:0; }
  .pk-pkg-price { font-size:11px;font-weight:900;color:#34d399;background:rgba(52,211,153,.07);padding:4px 9px;border-radius:8px;border:1px solid rgba(52,211,153,.14);white-space:nowrap; }
  .pk-pkg.active .pk-pkg-price { background:rgba(0,229,255,.1);border-color:rgba(0,229,255,.25);color:#67e8f9; }

  /* checkout aside */
  .pk-aside { background:rgba(255,255,255,.025);border:1px solid rgba(168,85,247,.14);border-radius:22px;padding:22px; }
  @media(min-width:1024px){ .pk-aside { position:sticky;top:24px; } }
  .pk-aside-tag { font-size:10px;font-weight:800;letter-spacing:.2em;color:#c084fc;text-transform:uppercase;margin:0 0 6px; }
  .pk-aside-sel { font-size:18px;font-weight:900;color:#f8fafc;margin:0 0 5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
  .pk-aside-hint { font-size:12px;color:#475569;margin:0 0 18px; }
  .pk-total-box { background:rgba(0,0,0,.3);border:1px solid rgba(168,85,247,.1);border-radius:14px;padding:14px 16px;margin-bottom:16px; }
  .pk-total-label { font-size:10px;font-weight:800;letter-spacing:.18em;color:#475569;text-transform:uppercase;margin:0 0 4px; }
  .pk-total-price { font-size:28px;font-weight:900;background:linear-gradient(135deg,#fff,#c084fc);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin:0; }

  /* terms */
  .pk-terms { display:flex;gap:10px;align-items:flex-start;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:12px 14px;margin-bottom:16px;cursor:pointer;font-family:inherit;width:100%;text-align:left; }
  .pk-terms input { margin-top:2px;accent-color:#c084fc;flex-shrink:0;cursor:pointer; }
  .pk-terms-txt { font-size:12px;font-weight:600;color:#94a3b8;line-height:1.5; }
  .pk-terms-link { color:#f8fafc;font-weight:800;text-transform:uppercase;font-size:11px; }

  /* pay button */
  .pk-pay-btn { width:100%;display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-radius:14px;background:linear-gradient(90deg,#a855f7,#7c3aed);border:none;font-family:inherit;font-size:13px;font-weight:900;letter-spacing:.12em;color:#fff;text-transform:uppercase;cursor:pointer;transition:all .25s;box-shadow:0 8px 32px rgba(168,85,247,.3); }
  .pk-pay-btn:hover:not(:disabled) { background:linear-gradient(90deg,#b56cff,#8b5cf6);box-shadow:0 12px 40px rgba(168,85,247,.45);transform:translateY(-1px); }
  .pk-pay-btn:disabled { background:rgba(51,65,85,.6);color:#475569;box-shadow:none;cursor:not-allowed;transform:none; }
  .pk-pay-btn:active:not(:disabled) { transform:scale(.98); }
  .pk-pay-badge { background:rgba(0,0,0,.25);padding:3px 8px;border-radius:6px;font-size:9px;font-weight:900;letter-spacing:.14em; }

  .pk-err-box { font-size:12px;font-weight:600;color:#f87171;background:rgba(248,113,113,.07);border:1px solid rgba(248,113,113,.15);border-radius:10px;padding:10px 14px;margin-bottom:12px; }

  /* state messages */
  .pk-state { padding:16px;color:#64748b;font-size:14px; }
  .pk-state-err { color:#f87171; }

  /* modal */
  .pk-modal-bg { position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.82);backdrop-filter:blur(10px);padding:16px; }
  .pk-modal { background:#0c0e1e;border:1px solid rgba(168,85,247,.22);border-radius:28px;padding:24px;width:100%;max-width:440px;text-align:center;position:relative;box-shadow:0 0 80px rgba(120,40,200,.25); }
  .pk-modal-close { position:absolute;top:14px;right:16px;background:none;border:none;font-size:20px;color:#475569;cursor:pointer;font-family:inherit;transition:color .2s; }
  .pk-modal-close:hover { color:#fff; }
  .pk-modal-title { font-size:16px;font-weight:900;color:#f8fafc;margin:0 0 18px;letter-spacing:.04em; }
  .pk-modal-frame { width:100%;height:490px;background:#fff;border-radius:16px;border:none; }

  /* section spacing */
  .pk-section + .pk-section { margin-top:0; }
  .pk-gap { display:flex;flex-direction:column;gap:20px; }
`;


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
  const showZoneInput = currentGameCode.includes("mlbb") || currentGameCode === "magic_chest_gogo" || currentGameCode === "mlbb_exclusive";


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
    // if (!usernameResult || acceptedTerms) return setError("Please complete required info and accept terms.");
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
    <div className="pk">
      <style>{PKG_CSS}</style>

      {/* Animated background blobs */}
      <div className="pk-blob pk-blob-1" />
      <div className="pk-blob pk-blob-2" />
      <div className="pk-blob pk-blob-3" />

      <div className="pk-wrap">
        {/* Back button */}
        <Link to="/" className="pk-back">← Back to games</Link>

        {loading ? (
          <div className="pk-state">Loading game packages...</div>
        ) : !game ? (
          <div className="pk-state pk-state-err">Game not found.</div>
        ) : (
          <div>
            {/* Hero Banner */}
            <div className="pk-hero">
              <img src="/banner.png" alt="Game Banner" loading="lazy" />
              <div className="pk-hero-ov" />
            </div>

            {/* Main Layout */}
            <div className="pk-layout">

              {/* Left Column */}
              <div className="pk-gap">

                {/* Game Header */}
                <div className="pk-section pk-game-hd">
                  <div className="pk-game-icon">
                    <span className="pk-game-icon-txt">{game.code?.substring(0, 4)}</span>
                  </div>
                  <div>
                    <h1 className="pk-game-name">{game.name}</h1>
                    <p className="pk-game-sub">{game.packages?.length ?? 0} packages available</p>
                  </div>
                </div>

                {/* Player Details */}
                <div className="pk-section">
                  <p className="pk-label-hd">Player Details</p>
                  <p className="pk-label-sub">Fill in your info exactly as shown in your game account.</p>

                  <div className="pk-input-grid">
                    <div className="pk-field">
                      <span className="pk-field-label">User ID / Player ID</span>
                      <input
                        className="pk-input"
                        value={form.user_id}
                        onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                        placeholder="702425515"
                      />
                    </div>
                    {showZoneInput && (
                      <div className="pk-field">
                        <span className="pk-field-label">Server / Zone ID</span>
                        <input
                          className="pk-input"
                          value={form.server_id}
                          onChange={(e) => setForm({ ...form, server_id: e.target.value })}
                          placeholder="10301"
                        />
                      </div>
                    )}
                  </div>

                  <div className="pk-check-row">
                    <div>
                      {usernameResult && (
                        <span className="pk-username-ok">✓ {usernameResult.player_name || usernameResult.username}</span>
                      )}
                      {usernameError && (
                        <span className="pk-username-err">⚠️ {usernameError}</span>
                      )}
                    </div>
                    <button type="button" onClick={handleCheckUsername} className="pk-check-btn">
                      {checkingUsername ? "Checking..." : "Check ID"}
                    </button>
                  </div>
                </div>

                {/* Package Selection */}
                <div className="pk-section">
                  <p className="pk-label-hd" style={{marginBottom:'14px'}}>Select Package</p>
                  <div className="pk-pkg-grid">
                    {sortedPackages.map((pkg) => {
                      const isActive = String(pkg.id) === String(selectedPackage);
                      return (
                        <button
                          key={pkg.id}
                          onClick={() => setSelectedPackage(String(pkg.id))}
                          className={`pk-pkg${isActive ? " active" : ""}`}
                        >
                          <div>
                            <p className="pk-pkg-name">{pkg.name}</p>
                            <p className="pk-pkg-diamonds">{pkg.diamond_amount} 💎</p>
                          </div>
                          <span className="pk-pkg-price">${Number(pkg.price).toFixed(2)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Checkout Aside */}
              <aside className="pk-aside">
                <p className="pk-aside-tag">Before Payment</p>
                <h3 className="pk-aside-sel">{activePackage?.name || "No Selection"}</h3>
                <p className="pk-aside-hint">Review your package and confirm terms to continue.</p>

                <div className="pk-total-box">
                  <p className="pk-total-label">Total</p>
                  <p className="pk-total-price">${Number(activePackage?.price || 0).toFixed(2)}</p>
                </div>

                <label className="pk-terms">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                  />
                  <span className="pk-terms-txt">
                    I agree to the <span className="pk-terms-link">Terms &amp; Conditions</span>
                  </span>
                </label>

                {error && <div className="pk-err-box">{error}</div>}

                <button
                  onClick={handleSubmit}
                  disabled={submitting || !acceptedTerms}
                  className="pk-pay-btn"
                >
                  <span>{submitting ? "Processing..." : "Pay Now"}</span>
                  <span className="pk-pay-badge">KHQR</span>
                </button>
              </aside>

            </div>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQrModal && paymentUrl && (
        <div className="pk-modal-bg">
          <div className="pk-modal">
            <button onClick={() => setShowQrModal(false)} className="pk-modal-close">✕</button>
            <h3 className="pk-modal-title">Scan to Pay (KHQR)</h3>
            <iframe src={paymentUrl} title="KHQR Web Interface" className="pk-modal-frame" />
          </div>
        </div>
      )}
    </div>
  );
}

export default Packages;