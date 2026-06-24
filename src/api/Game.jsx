import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { requestJson } from "./api"; // 🎯 ទាញយកមុខងារ Fetch ដែលលាក់ API Base URL រួចរាល់

function Game() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // 🎯 State សម្រាប់គ្រប់គ្រងការបង្ហាញ Alert Pop-up
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadGames() {
      try {
        setLoading(true);
        setError("");
        const data = await requestJson("/games");
        if (!ignore) {
          setGames(Array.isArray(data?.data) ? data.data : []);
        }
      } catch (err) {
        if (!ignore) setError(err.message || "Unable to load games.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadGames();

    // 🎯 ឆែកមើលថាតើម៉ូយធ្លាប់បានឃើញ Alert នេះហើយឬនៅ (First Time Visit Only)
    const hasSeenAlert = localStorage.getItem("has_seen_mlbb_alert");
    if (!hasSeenAlert) {
      setShowAlert(true);
    }

    return () => {
      ignore = true;
    };
  }, []);

  // 🎯 មុខងារបិទ Alert និងចំណាំទុកក្នុង Browser ឈប់ឱ្យលោតទៀត
  const handleCloseAlert = () => {
    localStorage.setItem("has_seen_mlbb_alert", "true");
    setShowAlert(false);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#1f3c88_0%,_#0f172a_40%,_#050816_100%)] text-white relative">
      
      {/* Fixed Header Section */}
      <div className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
        <header className="mx-auto flex max-w-7xl flex-col gap-4 rounded-3xl border border-white/10 bg-slate-950/80 px-5 py-4 shadow-2xl shadow-black/20 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-300 font-bold">
              Dyzz Diamond Top Up
            </p>
          </div>
        </header>
      </div>

      {/* Main Content Container */}
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-32 pt-24 sm:px-6 lg:px-8">
        <main className="flex-1">
          
          {loading ? (
            <div className="grid gap-3.5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 mt-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="h-44 sm:h-60 lg:h-72 animate-pulse rounded-3xl border border-white/10 bg-white/5"
                />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-6 text-red-100 mt-4">
              <p className="font-semibold">Could not load games</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          ) : games.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-slate-300 mt-4">
              No games found yet.
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Responsive Banner */}
              <div className="overflow-hidden mt-4 rounded-3xl border border-white/10 bg-white/5 shadow-lg shadow-black/20">
                <img
                  src="/bannerlistgame.png"
                  alt="Games banner"
                  className="h-36 w-full object-cover sm:h-56 md:h-64 lg:h-80"
                  loading="lazy"
                />
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-center my-6 tracking-wide">
                Fast Top Up
              </h1>

              {/* Game Grid Cards */}
              <div className="grid gap-3.5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 items-stretch">
                {games.map((game) => (
                  <Link
                    key={game.id}
                    to={`/games/${game.id}`}
                    state={{ game }}
                    className="group"
                  >
                    <article className="h-full overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60 shadow-xl shadow-black/10 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-cyan-400/40 group-hover:shadow-cyan-500/10 active:scale-95">
                      <div className="flex flex-col justify-between bg-gradient-to-br from-cyan-500/20 via-slate-950 to-fuchsia-500/15 p-4 min-h-[160px] sm:min-h-[200px] h-full">
                        
                        <div className="my-auto py-2">
                          <h3 className="text-base sm:text-lg lg:text-xl font-black text-white tracking-wide line-clamp-2 text-center group-hover:text-cyan-200 transition-colors">
                            {game.name}
                          </h3>
                        </div>

                        <div className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs sm:text-sm font-bold text-slate-300 transition group-hover:border-cyan-400/40 group-hover:bg-cyan-400/10 group-hover:text-white">
                          <span className="uppercase tracking-[0.2em]">
                            Top up
                          </span>
                        </div>

                      </div>
                    </article>
                  </Link>
                ))}
              </div>

            </div>
          )}
        </main>
      </div>

      {/* 🎯 ផ្ទាំង ALERT POP-UP សេចក្តីជូនដំណឹងអំពីល្បឿនបញ្ចូលពេជ្រ */}
      {showAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            
            {/* Icon កណ្ដឹងប្រកាស */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-400/20 mb-4">
              <span className="text-2xl">📢</span>
            </div>

            <h3 className="text-xl font-black text-white tracking-wide">សេចក្តីជូនដំណឹង / Notice</h3>
            <p className="text-xs text-slate-400 mt-1 mb-5">ព័ត៌មានលម្អិតអំពីល្បឿនសេវាកម្ម Mobile Legends</p>

            {/* បញ្ជីពន្យល់ពីល្បឿន លឿន ឬ យឺត */}
            <div className="space-y-3 text-left mb-6">
              
              {/* ខ្សែ Exclusive */}
              <div className="p-3.5 rounded-2xl border border-cyan-500/20 bg-cyan-500/5">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                  <span></span>
                  <h4>Mobile Legends Exclusive</h4>
                </div>
                <p className="text-xs text-slate-300 mt-1 pl-5 leading-relaxed">
                  ល្បឿនលឿនបំផុត **(Instant ចូលភ្លាមៗក្នុង ១ វិនាទី)** ក្រោយពេលបង់ប្រាក់រួចរាល់។
                </p>
              </div>

              {/* ខ្សែ Regular */}
              <div className="p-3.5 rounded-2xl border border-amber-500/20 bg-amber-500/5">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <span></span>
                  <h4>Mobile Legends (Regular)</h4>
                </div>
                <p className="text-xs text-slate-300 mt-1 pl-5 leading-relaxed">
                  ល្បឿនធម្មតា **(រង់ចាំចន្លោះពី ១ ទៅ ៥ នាទី)** ប៉ុន្តែតម្លៃធូរថ្លៃជាងមុន។
                </p>
              </div>

            </div>

            {/* ប៊ូតុងយល់ព្រមបិទផ្ទាំង */}
            <button
              onClick={handleCloseAlert}
              className="w-full py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm tracking-wider transition active:scale-[0.98] cursor-pointer"
            >
              ខ្ញុំបានយល់ / I UNDERSTAND
            </button>

          </div>
        </div>
      )}

    </div>
  );
}

export default Game;