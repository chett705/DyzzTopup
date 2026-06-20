import { useEffect, useState } from "react";
import {
  createAdminPackage,
  fetchAdminDashboard,
  updateAdminPackage,
} from "../services/adminService";

function PackageManagement() {
  const [packages, setPackages] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [drafts, setDrafts] = useState({});
  const [createForm, setCreateForm] = useState({
    game_id: "",
    name: "",
    price: "",
    diamond_amount: "",
    is_active: true,
  });

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        // 🔑 ចាប់យក Token ផ្ទាល់ខ្លួនលើម៉ាស៊ីន Local
        const token = localStorage.getItem("admin_token");

        // 🚀 បោះ Token ចូលដើម្បីទាញទិន្នន័យ Dashboard/Packages
        const result = await fetchAdminDashboard(token);
        const items = Array.isArray(result?.packages) ? result.packages : [];
        const gameItems = Array.isArray(result?.games) ? result.games : [];

        if (ignore) return;

        setPackages(items);
        setGames(gameItems);

        const nextDrafts = {};
        items.forEach((pkg) => {
          nextDrafts[pkg.id] = {
            game_id: pkg.game_id ?? pkg.topup_game_id ?? pkg.game?.id ?? "",
            name: pkg.name ?? "",
            price: pkg.price ?? "",
            diamond_amount: pkg.diamond_amount ?? "",
            is_active: Boolean(pkg.is_active),
          };
        });
        setDrafts(nextDrafts);
      } catch (err) {
        if (!ignore) setError(err.response?.data?.message || err.message || "Unable to load packages.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, []);

  function updateDraft(id, field, value) {
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...(current[id] || {}),
        [field]: value,
      },
    }));
  }

  async function handleCreatePackage(event) {
    event.preventDefault();

    try {
      setCreating(true);
      setError("");
      setMessage("");

      const payload = {
        game_id: Number(createForm.game_id),
        name: createForm.name.trim(),
        price: Number(createForm.price),
        diamond_amount: Number(createForm.diamond_amount),
        is_active: Boolean(createForm.is_active),
      };

      // 🔑 ចាប់យក Token សម្រាប់វគ្គផ្ញើទិន្នន័យ POST
      const token = localStorage.getItem("admin_token");

      // 🚀 បោះទាំង Payload និង Token ទៅកាន់ API
      const result = await createAdminPackage(payload, token);
      const createdPackage = result?.package || result?.data?.package || result;

      if (createdPackage) {
        setPackages((current) => [createdPackage, ...current]);
        setDrafts((current) => ({
          ...current,
          [createdPackage.id]: {
            game_id: createdPackage.game_id ?? createdPackage.topup_game_id ?? createdPackage.game?.id ?? "",
            name: createdPackage.name ?? "",
            price: createdPackage.price ?? "",
            diamond_amount: createdPackage.diamond_amount ?? "",
            is_active: Boolean(createdPackage.is_active),
          },
        }));
      }

      setCreateForm({
        game_id: "",
        name: "",
        price: "",
        diamond_amount: "",
        is_active: true,
      });
      setMessage("Package created successfully.");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to create package.");
    } finally {
      setCreating(false);
    }
  }

  async function savePackage(id) {
    const draft = drafts[id];
    try {
      setSavingId(id);
      setError("");

      // 🔑 ចាប់យក Token សម្រាប់វគ្គ PATCH (Update)
      const token = localStorage.getItem("admin_token");

      const result = await updateAdminPackage(id, draft, token);
      const updated = result?.package || result?.data?.package || result;

      if (updated) {
        setPackages((current) =>
          current.map((item) =>
            String(item.id) === String(id) ? { ...item, ...updated } : item
          )
        );
      }
      setMessage("Package updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to update package.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">
          Management
        </p>
        <h1 className="mt-2 text-3xl font-black">Package Management</h1>
      </div>

      <form
        onSubmit={handleCreatePackage}
        className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-200">
              Create
            </p>
            <h2 className="mt-1 text-2xl font-bold">Add New Package</h2>
          </div>
          {message ? <p className="text-sm font-semibold text-emerald-300">{message}</p> : null}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.25em] text-slate-300">
              Game
            </span>
            <select
              value={createForm.game_id}
              onChange={(e) => setCreateForm({ ...createForm, game_id: e.target.value })}
              className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-cyan-400/60"
              required
            >
              <option value="">Select game</option>
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.name || game.code || `Game ${game.id}`}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.25em] text-slate-300">
              Name
            </span>
            <input
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-cyan-400/60"
              placeholder="Weekly Diamond Pack"
              // required
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.25em] text-slate-300">
              Price
            </span>
            <input
              type="number"
              value={createForm.price}
              onChange={(e) => setCreateForm({ ...createForm, price: e.target.value })}
              className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-cyan-400/60"
              placeholder="10000"
              required
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.25em] text-slate-300">
              Diamonds
            </span>
            <input
              type="number"
              value={createForm.diamond_amount}
              onChange={(e) =>
                setCreateForm({ ...createForm, diamond_amount: e.target.value })
              }
              className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-cyan-400/60"
              placeholder="86"
              required
            />
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
            <input
              type="checkbox"
              checked={createForm.is_active}
              onChange={(e) => setCreateForm({ ...createForm, is_active: e.target.checked })}
            />
            <span className="text-sm font-semibold">Active</span>
          </label>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="submit"
            disabled={creating}
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creating ? "Creating..." : "Create Package"}
          </button>
        </div>
      </form>

      {/* List Packages Section */}
      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-300">
          Loading packages...
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-6 text-red-100">
          {error}
        </div>
      ) : packages.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-300">
          No packages found.
        </div>
      ) : (
        <div className="grid gap-4">
          {packages.map((pkg) => {
            const draft = drafts[pkg.id] || {};

            return (
              <article
                key={pkg.id}
                className="rounded-3xl border border-white/10 bg-white/5 p-5"
              >
                <div className="grid gap-4 lg:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-xs uppercase tracking-[0.25em] text-slate-400">
                      Game
                    </span>
                    <select
                      value={draft.game_id ?? ""}
                      onChange={(e) => updateDraft(pkg.id, "game_id", e.target.value)}
                      className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-cyan-400/60"
                    >
                      <option value="">Select game</option>
                      {games.map((game) => (
                        <option key={game.id} value={game.id}>
                          {game.name || game.code || `Game ${game.id}`}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-xs uppercase tracking-[0.25em] text-slate-400">
                      Name
                    </span>
                    <input
                      value={draft.name ?? ""}
                      onChange={(e) => updateDraft(pkg.id, "name", e.target.value)}
                      className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-cyan-400/60"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-xs uppercase tracking-[0.25em] text-slate-400">
                      Price
                    </span>
                    <input
                      type="number"
                      value={draft.price ?? ""}
                      onChange={(e) => updateDraft(pkg.id, "price", e.target.value)}
                      className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-cyan-400/60"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-xs uppercase tracking-[0.25em] text-slate-400">
                      Diamonds
                    </span>
                    <input
                      type="number"
                      value={draft.diamond_amount ?? ""}
                      onChange={(e) =>
                        updateDraft(pkg.id, "diamond_amount", e.target.value)
                      }
                      className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-cyan-400/60"
                    />
                  </label>

                  <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={Boolean(draft.is_active)}
                      onChange={(e) =>
                        updateDraft(pkg.id, "is_active", e.target.checked)
                      }
                    />
                    <span className="text-sm font-semibold">Active</span>
                  </label>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="text-sm text-slate-400">
                    ID: {pkg.id} {pkg.game?.name ? `• ${pkg.game.name}` : ""}
                  </div>
                  <button
                    type="button"
                    onClick={() => savePackage(pkg.id)}
                    disabled={savingId === pkg.id}
                    className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingId === pkg.id ? "Saving..." : "Save Package"}
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

export default PackageManagement;