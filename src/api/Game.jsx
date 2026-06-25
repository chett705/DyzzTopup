import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { requestJson } from "./api";

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
    <div className="min-h-screen bg-[#060913] text-white p-4 sm:p-6 lg:p-8 font-sans">
      <div className="mx-auto max-w-7xl">
        
        {/* 🎯 Top Mini Bar (ដូចក្នុងរូបថតទី ១) */}
        <div className="w-full mb-6 max-w-7xl mx-auto rounded-full border border-slate-900 bg-[#0b1120]/60 px-6 py-3 backdrop-blur-md">
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-cyan-400">
            DYZZ DIAMOND TOP UP
          </span>
        </div>

        {/* 🎯 Banner Slot */}
        <div className="overflow-hidden rounded-3xl border border-slate-900 bg-[#0d1527] shadow-2xl shadow-black/40">
          <img
            src="/banner.png"
            alt="Topup Game Banner"
            className="w-full h-auto object-cover max-h-[320px]"
            loading="lazy"
          />
        </div>

        {/* 🎯 Heading Title "Fast Top Up" */}
        <div className="text-center my-10">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
            Fast Top Up
          </h2>
        </div>

        {/* Loading / Error States */}
        {loading ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-w-5xl mx-auto">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-56 rounded-3xl bg-[#0b1120]/60 border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-500/10 bg-rose-500/5 p-4 text-center text-rose-400 text-sm font-semibold max-w-md mx-auto">
            ⚠️ {error}
          </div>
        ) : (
          /* 🎯 Games Grid (ទម្រង់ Card ធំៗដូចរូប image_13f1a7.jpg) */
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-w-5xl mx-auto items-stretch">
            {games.map((g) => (
              <Link
                key={g.id}
                to={`/games/${g.id}`}
                className="group relative flex min-h-[220px] flex-col justify-between rounded-3xl border border-cyan-500/10 bg-gradient-to-b from-[#0e172c] to-[#0a0f1d] p-6 text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/5 active:scale-95"
              >
                {/* Center Content: Game Name */}
                <div className="flex-1 flex items-center justify-center py-4">
                  <h3 className="text-lg sm:text-xl font-black text-slate-100 tracking-wide group-hover:text-cyan-400 transition-colors">
                    {g.name}
                  </h3>
                </div>

                {/* Bottom Pill Capsule Button */}
                <div className="w-full rounded-2xl border border-slate-800 bg-[#121c35]/40 py-2.5 text-xs font-black tracking-widest text-slate-400 transition-all duration-300 group-hover:border-cyan-500/30 group-hover:bg-cyan-500/10 group-hover:text-cyan-400">
                  TOP UP
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

export default Game;