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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#1f3c88_0%,_#0f172a_40%,_#050816_100%)] text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 px-5 py-5 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-300">
              Dyzz Diamond Top Up
            </p>
            {/* <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              Fast, clean, and secure
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
              Pick a game, choose a package, pay with KHQR
            </p> */}
          </div>

          {/* <div className="grid grid-cols-3 gap-3 text-center text-xs sm:text-sm">
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3">
              Instant
              <div className="mt-1 font-semibold text-emerald-300">
                Delivery
              </div>
            </div>
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3">
              Safe
              <div className="mt-1 font-semibold text-cyan-200">Checkout</div>
            </div>
            <div className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/10 px-4 py-3">
              Live
              <div className="mt-1 font-semibold text-fuchsia-200">
                Tracking
              </div>
            </div>
          </div> */}
        </header>

        <main className="flex-1">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="h-72 animate-pulse rounded-3xl border border-white/10 bg-white/5"
                />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-6 text-red-100">
              <p className="font-semibold">Could not load games</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          ) : games.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-slate-300">
              No games found yet.
            </div>
          ) : (
            <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 items-stretch">
              {games.map((game) => (
                <Link
                  key={game.id}
                  to={`/games/${game.id}`}
                  state={{ game }}
                  className="group"
                >
                  <article className="h-full overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60 shadow-2xl shadow-black/20 transition duration-300 group-hover:-translate-y-1 group-hover:border-cyan-400/40 group-hover:shadow-cyan-500/10">
                    <div className="flex aspect-square items-center flex-col justify-between bg-gradient-to-br from-cyan-500/20 via-slate-950 to-fuchsia-500/15 p-4 h-full">
                      {/* <div className="flex items-start justify-between gap-2">
                        <div className="rounded-full border border-cyan-400/20 bg-slate-950/60 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200 truncate max-w-[60%]">
                          {game.code || "game"}
                        </div>
                        <div
                          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                            game.is_active
                              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                              : "border-amber-400/20 bg-amber-400/10 text-amber-200"
                          }`}
                        >
                          {game.is_active ? "Active" : "Paused"}
                        </div>
                      </div> */}

                      <div className="my-4">
                        
                        <h3 className="mt-1 text-xl sm:text-2xl font-black text-white tracking-wide line-clamp-2">
                          {game.name}
                        </h3>
                      </div>

                      <div className="flex items-center justify-end text-xs">
                       <p className="text-[10px] border px-2.5 py-1 rounded-4xl text-center uppercase tracking-[0.3em] text-slate-400 font-medium">
                          Top up
                        </p>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Game;
