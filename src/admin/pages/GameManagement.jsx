import { useEffect, useState } from "react";
import { createAdminGame, fetchAdminDashboard } from "../services/adminService";

function GameManagement() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    code: "",
    is_active: true,
  });

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const result = await fetchAdminDashboard();
        if (!ignore) setGames(Array.isArray(result?.games) ? result.games : []);
      } catch (err) {
        if (!ignore) setError(err.message || "Unable to load games.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const result = await createAdminGame({
        name: form.name,
        code: form.code,
        is_active: form.is_active,
      });

      const createdGame = result?.game || result?.data?.game || result;
      if (createdGame) {
        setGames((current) => [createdGame, ...current]);
      }

      setForm({
        name: "",
        code: "",
        is_active: true,
      });
      setMessage("Game created successfully.");
    } catch (err) {
      setError(err.message || "Unable to create game.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">
          Management
        </p>
        <h1 className="mt-2 text-3xl font-black">Game Management</h1>
      </div>

      <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="grid gap-4 lg:grid-cols-3">
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.25em] text-slate-400">Name</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-cyan-400/60"
              placeholder="Mobile Legends"
              required
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.25em] text-slate-400">Code</span>
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-cyan-400/60"
              placeholder="mlbb"
              required
            />
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            <span className="text-sm font-semibold">Active</span>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Creating..." : "Create Game"}
          </button>
          {message ? <p className="self-center text-sm text-emerald-300">{message}</p> : null}
        </div>
      </form>

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-300">
          Loading existing games...
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-6 text-red-100">
          {error}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {games.map((game) => (
            <article key={game.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Game</p>
              <h2 className="mt-2 text-2xl font-bold text-white">{game.name || "-"}</h2>
              <p className="mt-2 text-sm text-slate-300">Code: {game.code || "-"}</p>
              <p className="mt-1 text-sm text-slate-300">
                Status: {game.is_active ? "Active" : "Paused"}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default GameManagement;
