import { useEffect, useState } from "react";
import { createAdminGame, fetchAdminDashboard, updateAdminOrder } from "../services/adminService"; 
// 🎯 ចំណាំ៖ ប្រសិនបើក្នុង adminService.js បងដាក់ឈ្មោះប្រព័ន្ធដូរហ្គេមថា updateAdminGame សូមប្ដូរឈ្មោះទាញយកខាងលើនេះឱ្យត្រូវគ្នាណាcharបង
import { updateAdminPackage } from "../services/adminService"; 

// បង្កើតមុខងារជំនួយសម្រាប់បាញ់ទៅ Update Game (ករណីមិនទាន់មានក្នុង adminService.js)
import { adminApi } from "../services/adminService";
async function localUpdateAdminGame(gameId, payload) {
  const response = await adminApi.patch(`/admin/games/${encodeURIComponent(gameId)}`, payload);
  return response?.data;
}

function GameManagement() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingId, setSavingId] = useState(null); // 🎯 ចាប់ ID ហ្គេមដែលកំពុងចុច Save
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [drafts, setDrafts] = useState({}); // 🎯 រក្សាទុកទិន្នន័យកែប្រែបណ្ដោះអាសន្ន (Drafts)
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
        if (ignore) return;

        const items = Array.isArray(result?.games) ? result.games : [];
        setGames(items);

        // 🎯 ដំឡើងតម្លៃលំនាំដើមទៅក្នុង Drafts សម្រាប់រាល់ហ្គេមទាំងអស់
        const nextDrafts = {};
        items.forEach((game) => {
          nextDrafts[game.id] = {
            name: game.name || "",
            code: game.code || "",
            is_active: Boolean(game.is_active),
          };
        });
        setDrafts(nextDrafts);
      } catch (err) {
        if (!ignore) setError(err.response?.data?.message || err.message || "Unable to load games.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, []);

  // 🎯 មុខងារធ្វើបច្ចុប្បន្នភាព Draft នៅពេល Admin វាយអក្សរកែប្រែលើប្រអប់
  function updateDraft(id, field, value) {
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...(current[id] || {}),
        [field]: value,
      },
    }));
  }

  // ➕ មុខងារបង្កើតហ្គេមថ្មី (Create Game)
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
        // ថែមចូលក្នុង Draft ដែរដើម្បីឱ្យអាចកែប្រែបានភ្លាមៗ
        setDrafts((current) => ({
          ...current,
          [createdGame.id]: {
            name: createdGame.name || "",
            code: createdGame.code || "",
            is_active: Boolean(createdGame.is_active),
          },
        }));
      }

      setForm({ name: "", code: "", is_active: true });
      setMessage("Game created successfully.");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to create game.");
    } finally {
      setSaving(false);
    }
  }

  // 💾 មុខងារថ្មី៖ រុញទិន្នន័យដែលកែប្រែរួចទៅរក្សាទុកក្នុង Database (Save Game)
  async function saveGame(id) {
    const draft = drafts[id];
    try {
      setSavingId(id);
      setError("");
      setMessage("");

      // 🚀 បាញ់ទៅកាន់ផ្លូវ PATCH លើ Laravel
      const result = await localUpdateAdminGame(id, draft);
      const updated = (result?.game || result?.data) ?? result;

      if (updated) {
        setGames((current) =>
          current.map((item) =>
            String(item.id) === String(id) ? { ...item, ...updated } : item
          )
        );
      }
      setMessage("Game updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to update game.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Management</p>
          <h1 className="mt-2 text-3xl font-black">Game Management</h1>
        </div>
        {message ? <p className="text-sm font-semibold text-emerald-300 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">{message}</p> : null}
        {error ? <p className="text-sm font-semibold text-red-300 bg-red-500/10 px-4 py-2 rounded-full border border-red-500/20">{error}</p> : null}
      </div>

      {/* ➕ ផ្ទាំងបង្កើតហ្គេមថ្មី */}
      <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-400 mb-4 font-bold">Add New Game</p>
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

          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 mt-auto h-[50px]">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            <span className="text-sm font-semibold">Active Status</span>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Creating..." : "Create Game"}
          </button>
        </div>
      </form>

      {/* 📜 បញ្ជីហ្គេមទាំងអស់សម្រាប់កែប្រែ (Update List) */}
      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-300">
          Loading existing games...
        </div>
      ) : games.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-300">
          No games found.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {games.map((game) => {
            const draft = drafts[game.id] || {};
            return (
              <article key={game.id} className="rounded-3xl border border-white/10 bg-white/5 p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <label className="grid gap-1">
                    <span className="text-[10px] uppercase tracking-[0.25em] text-slate-400">Game Name</span>
                    <input
                      type="text"
                      value={draft.name ?? ""}
                      onChange={(e) => updateDraft(game.id, "name", e.target.value)}
                      className="rounded-xl border border-white/5 bg-slate-950/50 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
                    />
                  </label>

                  <label className="grid gap-1">
                    <span className="text-[10px] uppercase tracking-[0.25em] text-slate-400">Game Code</span>
                    <input
                      type="text"
                      value={draft.code ?? ""}
                      onChange={(e) => updateDraft(game.id, "code", e.target.value)}
                      className="rounded-xl border border-white/5 bg-slate-950/50 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
                    />
                  </label>

                  <label className="flex items-center gap-3 rounded-xl border border-white/5 bg-slate-950/20 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={Boolean(draft.is_active)}
                      onChange={(e) => updateDraft(game.id, "is_active", e.target.checked)}
                    />
                    <span className="text-xs font-semibold text-slate-300">Active</span>
                  </label>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500 font-mono">ID: {game.id}</span>
                  <button
                    type="button"
                    onClick={() => saveGame(game.id)}
                    disabled={savingId === game.id}
                    className="rounded-full bg-cyan-400/10 border border-cyan-400/20 px-4 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-400 hover:text-slate-950 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingId === game.id ? "Saving..." : "Save Game"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default GameManagement;