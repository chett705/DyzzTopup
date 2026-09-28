import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { requestJson } from "./api";

/* ─── Inline CSS injected once ─── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap');

  .gp { min-height:100vh; background:#07081a; color:#fff; font-family:'Outfit',sans-serif; position:relative; overflow-x:hidden; }

  /* blobs */
  .gp-blob { position:fixed; border-radius:50%; filter:blur(130px); pointer-events:none; z-index:0; }
  .gp-blob-1 { width:650px;height:650px; background:radial-gradient(circle,rgba(120,40,220,0.22) 0%,transparent 70%); top:-180px;left:-120px; animation:gpFloat 14s ease-in-out infinite alternate; }
  .gp-blob-2 { width:520px;height:520px; background:radial-gradient(circle,rgba(0,210,255,0.13) 0%,transparent 70%); top:45%;right:-120px; animation:gpFloat 10s ease-in-out infinite alternate-reverse; }
  .gp-blob-3 { width:420px;height:420px; background:radial-gradient(circle,rgba(220,40,255,0.12) 0%,transparent 70%); bottom:0;left:32%; animation:gpFloat 16s ease-in-out infinite alternate; }
  @keyframes gpFloat { from{transform:translate(0,0) scale(1)} to{transform:translate(28px,36px) scale(1.07)} }

  /* container */
  .gp-wrap { position:relative;z-index:1;max-width:1200px;margin:0 auto;padding:20px 16px 70px; }

  /* topbar */
  .gp-topbar { display:flex;align-items:center;justify-content:space-between; background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);backdrop-filter:blur(18px);border-radius:100px;padding:11px 20px;margin-bottom:22px; }
  .gp-brand { display:flex;align-items:center;gap:8px; }
  .gp-gem { font-size:20px;background:linear-gradient(135deg,#00e5ff,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text; }
  .gp-brand-txt { font-size:10.5px;font-weight:900;letter-spacing:.26em;background:linear-gradient(90deg,#00e5ff,#c084fc);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;text-transform:uppercase; }
  .gp-track { font-size:11px;font-weight:700;color:#94a3b8;border:1px solid rgba(255,255,255,0.1);border-radius:100px;padding:6px 16px;transition:all .2s; }
  .gp-track:hover { color:#00e5ff;border-color:rgba(0,229,255,.3);background:rgba(0,229,255,.05); }

  /* hero */
  .gp-hero { position:relative;border-radius:24px;overflow:hidden;border:1px solid rgba(168,85,247,.22);box-shadow:0 0 70px rgba(100,30,200,.2),0 0 0 1px rgba(255,255,255,.03);margin-bottom:52px; }
  .gp-hero img { width:100%;height:auto;max-height:340px;object-fit:cover;display:block; }
  .gp-hero-ov { position:absolute;inset:0;background:linear-gradient(to top,rgba(7,8,26,.65) 0%,transparent 55%); }
  .gp-badge { position:absolute;bottom:16px;right:16px;display:flex;align-items:center;gap:6px;background:rgba(0,229,255,.1);border:1px solid rgba(0,229,255,.25);backdrop-filter:blur(12px);border-radius:100px;padding:5px 14px;font-size:10px;font-weight:800;letter-spacing:.22em;color:#00e5ff;text-transform:uppercase; }
  .gp-dot { width:6px;height:6px;background:#00e5ff;border-radius:50%;animation:gpPulse 1.6s infinite;box-shadow:0 0 8px #00e5ff; }
  @keyframes gpPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.4)} }

  /* section header */
  .gp-sec-hd { display:flex;align-items:center;gap:14px;margin-bottom:8px; }
  .gp-line { flex:1;height:1px;background:linear-gradient(90deg,transparent,rgba(168,85,247,.38),transparent); }
  .gp-sec-title { font-size:22px;font-weight:900;letter-spacing:.04em;white-space:nowrap;display:flex;align-items:center;gap:8px;background:linear-gradient(135deg,#fff 0%,#c084fc 55%,#00e5ff 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin:0; }
  .gp-sec-icon { background:linear-gradient(135deg,#facc15,#f97316);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text; }
  .gp-sec-sub { text-align:center;color:#475569;font-size:13px;margin:0 0 38px; }

  /* grid */
  .gp-grid { display:grid;gap:20px;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));max-width:900px;margin:0 auto; }

  /* skeleton */
  .gp-skel { height:220px;border-radius:20px;background:linear-gradient(135deg,rgba(255,255,255,.03),rgba(255,255,255,.01));border:1px solid rgba(255,255,255,.04);animation:gpShimmer 1.8s ease-in-out infinite; }
  @keyframes gpShimmer { 0%,100%{opacity:.35} 50%{opacity:.75} }

  /* card */
  .gp-card { position:relative;display:flex;flex-direction:column;align-items:center;justify-content:space-between;gap:14px;padding:28px 18px 18px;min-height:220px;border-radius:20px;border:1px solid rgba(168,85,247,.14);background:linear-gradient(160deg,rgba(18,8,42,.92) 0%,rgba(8,6,22,.96) 100%);backdrop-filter:blur(8px);text-align:center;text-decoration:none;color:inherit;overflow:hidden;transition:transform .32s cubic-bezier(.34,1.56,.64,1),border-color .28s,box-shadow .28s;cursor:pointer; }
  .gp-card:hover { transform:translateY(-7px) scale(1.012);border-color:rgba(168,85,247,.48);box-shadow:0 24px 64px rgba(110,30,200,.28),0 0 0 1px rgba(168,85,247,.18),inset 0 1px 0 rgba(255,255,255,.04); }
  .gp-card:active { transform:scale(.97); }
  .gp-card-glow { position:absolute;inset:0;border-radius:20px;background:radial-gradient(ellipse at 50% -5%,rgba(168,85,247,.16) 0%,transparent 60%);opacity:0;transition:opacity .3s; }
  .gp-card:hover .gp-card-glow { opacity:1; }

  .gp-icon { width:68px;height:68px;border-radius:18px;background:linear-gradient(135deg,rgba(168,85,247,.18),rgba(0,229,255,.09));border:1px solid rgba(168,85,247,.28);display:flex;align-items:center;justify-content:center;box-shadow:0 0 28px rgba(168,85,247,.1);transition:box-shadow .3s; }
  .gp-card:hover .gp-icon { box-shadow:0 0 46px rgba(168,85,247,.36); }
  .gp-icon-txt { font-size:22px;font-weight:900;letter-spacing:-.02em;background:linear-gradient(135deg,#c084fc,#00e5ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text; }

  .gp-name { font-size:16px;font-weight:800;color:#e2e8f0;line-height:1.3;flex:1;display:flex;align-items:center;justify-content:center;margin:0;transition:color .25s; }
  .gp-card:hover .gp-name { color:#fff; }

  .gp-cta { width:100%;display:flex;align-items:center;justify-content:center;gap:8px;padding:9px 14px;border-radius:12px;border:1px solid rgba(168,85,247,.18);background:rgba(168,85,247,.05);font-size:10px;font-weight:900;letter-spacing:.22em;color:#64748b;text-transform:uppercase;transition:all .28s; }
  .gp-arrow { transition:transform .28s; display:inline-block; }
  .gp-card:hover .gp-cta { background:linear-gradient(90deg,rgba(168,85,247,.14),rgba(0,229,255,.08));border-color:rgba(0,229,255,.28);color:#00e5ff; }
  .gp-card:hover .gp-arrow { transform:translateX(5px); }

  /* error */
  .gp-err { max-width:480px;margin:0 auto;padding:16px 20px;border-radius:16px;border:1px solid rgba(239,68,68,.2);background:rgba(239,68,68,.06);color:#fca5a5;font-size:14px;font-weight:600;text-align:center; }

  /* footer */
  .gp-footer { text-align:center;margin-top:64px;color:#1e293b;font-size:11px;letter-spacing:.08em; }

  @media(max-width:640px){
    .gp-brand-txt{display:none}
    .gp-grid{grid-template-columns:repeat(2,1fr);gap:12px}
    .gp-card{min-height:175px;padding:18px 10px 13px;gap:10px}
    .gp-icon{width:50px;height:50px;border-radius:13px}
    .gp-icon-txt{font-size:15px}
    .gp-name{font-size:13px}
    .gp-hero img{max-height:170px}
    .gp-sec-title{font-size:17px}
  }
`;

function Game() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    async function loadGames() {
      try {
        setLoading(true);
        setError("");
        const response = await requestJson("/games");
        const gameItems = Array.isArray(response?.data) ? response.data : [];
        if (!ignore) setGames(gameItems);
      } catch (err) {
        if (!ignore) setError(err.message || "Unable to load games list.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadGames();
    return () => { ignore = true; };
  }, []);

  return (
    <div className="gp">
      <style>{CSS}</style>

      {/* Animated background blobs */}
      <div className="gp-blob gp-blob-1" />
      <div className="gp-blob gp-blob-2" />
      <div className="gp-blob gp-blob-3" />

      <div className="gp-wrap">

        {/* Top Nav Bar */}
        <header className="gp-topbar">
          <div className="gp-brand">
            <span className="gp-gem">◈</span>
            <span className="gp-brand-txt">DYZZ DIAMOND TOP UP</span>
          </div>
          <Link to="/orders" className="gp-track">Track Order</Link>
        </header>

        {/* Hero Banner */}
        <div className="gp-hero">
          <img src="/banner.png" alt="Dyzz Diamond Top Up Banner" loading="lazy" />
          <div className="gp-hero-ov" />
          <div className="gp-badge">
            <span className="gp-dot" />
            INSTANT DELIVERY
          </div>
        </div>

        {/* Section Header */}
        <div className="gp-sec-hd">
          <div className="gp-line" />
          <h2 className="gp-sec-title"><span className="gp-sec-icon">⚡</span> Select Your Game</h2>
          <div className="gp-line" />
        </div>
        <p className="gp-sec-sub">Choose a game below to top up diamonds instantly &amp; securely.</p>

        {/* Games Grid */}
        {loading ? (
          <div className="gp-grid">
            {[...Array(6)].map((_, i) => <div key={i} className="gp-skel" />)}
          </div>
        ) : error ? (
          <div className="gp-err">⚠️ {error}</div>
        ) : (
          <div className="gp-grid">
            {games.map((g) => (
              <Link key={g.id} to={`/games/${g.id}`} className="gp-card">
                <div className="gp-card-glow" />
                <div className="gp-icon">
                  <span className="gp-icon-txt">{g.name?.substring(0, 2).toUpperCase()}</span>
                </div>
                <h3 className="gp-name">{g.name}</h3>
                <div className="gp-cta">
                  <span>TOP UP NOW</span>
                  <span className="gp-arrow">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <footer className="gp-footer">© 2025 Dyzztopup · Fast · Secure · Instant</footer>
      </div>
    </div>
  );
}

export default Game;