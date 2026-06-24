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

    return () => {
      ignore = true;
    };
  }, []);

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

      {/* 🎯 Main Content Container៖ ថែម pb-32 ដើម្បីកុំឱ្យបុកបាតរបារទូរស័ព្ទ */}
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-32 pt-24 sm:px-6 lg:px-8">
        <main className="flex-1">
          
          {/* Loading Skeleton Responsive Grid */}
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
              
              {/* Responsive Banner List Game */}
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

              {/* 📊 Responsive Grid Layout៖ រៀប ២ ជួរលើទូរស័ព្ទ និងដកគាំង aspect-square ចោល */}
              <div className="grid gap-3.5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 items-stretch">
                {games.map((game) => (
                  <Link
                    key={game.id}
                    to={`/games/${game.id}`}
                    state={{ game }}
                    className="group"
                  >
                    <article className="h-full overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60 shadow-xl shadow-black/10 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-cyan-400/40 group-hover:shadow-cyan-500/10 active:scale-95">
                      
                      {/* សម្រួល Flex-col ឱ្យដេញខ្នាតសមសួនរវាងឈ្មោះហ្គេម និង ប៊ូតុង Top Up */}
                      <div className="flex flex-col justify-between bg-gradient-to-br from-cyan-500/20 via-slate-950 to-fuchsia-500/15 p-4 min-h-[160px] sm:min-h-[200px] h-full">
                        
                        {/* Title Game Name */}
                        <div className="my-auto py-2">
                          <h3 className="text-base sm:text-lg lg:text-xl font-black text-white tracking-wide line-clamp-2 text-center group-hover:text-cyan-200 transition-colors">
                            {game.name}
                          </h3>
                        </div>

                        {/* Action Top up Bottom Bar */}
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
    </div>
  );
}

export default Game;