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
              Diamond Top Up
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              Fast, clean, and secure diamond delivery
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
              Pick a game, choose a package, pay with KHQR, and track your
              order in one smooth flow.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center text-xs sm:text-sm">
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3">
              Instant
              <div className="mt-1 font-semibold text-emerald-300">Delivery</div>
            </div>
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3">
              Safe
              <div className="mt-1 font-semibold text-cyan-200">Checkout</div>
            </div>
            <div className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/10 px-4 py-3">
              Live
              <div className="mt-1 font-semibold text-fuchsia-200">Tracking</div>
            </div>
          </div>
        </header>

        <main className="flex-1">
          {/* <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">
                Available games
              </p>
              <h2 className="mt-1 text-2xl font-bold">
                Choose your top up target
              </h2>
            </div>

            <Link
              to="/orders"
              className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
            >
              Track Order
            </Link>
          </div> */}

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
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {games.map((game) => (
                <Link
                  key={game.id}
                  to={`/games/${game.id}`}
                  state={{ game }}
                  className="group"
                >
                  <article className="h-full overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60 shadow-2xl shadow-black/20 transition duration-300 group-hover:-translate-y-1 group-hover:border-cyan-400/40 group-hover:shadow-cyan-500/10">
                    <div className="flex aspect-[4/4] flex-col justify-between bg-gradient-to-br from-cyan-500/20 via-slate-950 to-fuchsia-500/15 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="rounded-full border border-cyan-400/20 bg-slate-950/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-200">
                          {game.code || "game"}
                        </div>
                        <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                          {game.is_active ? "Active" : "Paused"}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm uppercase tracking-[0.35em] text-slate-300">
                          Top up
                        </p>
                        <h3 className="mt-2 text-2xl font-black text-white">
                          {game.name}
                        </h3>
                        <p className="mt-2 text-sm text-slate-300">
                          {game.packages?.length || 0} packages ready
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-sm text-slate-300">
                        <span>{game.code || "topup"}</span>
                        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-emerald-200">
                          Open shop
                        </span>
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
