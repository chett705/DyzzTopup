import { useEffect, useState } from "react";
import {
  createAdminPackage,
  deleteAdminPackage,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGameFilter, setSelectedGameFilter] = useState("");

  const [createForm, setCreateForm] = useState({
    game_id: "",
    name: "",
    price: "",
    diamond_amount: "",
    sku: "",
    is_active: true,
  });

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        const result = await fetchAdminDashboard();
        const items = Array.isArray(result?.packages) ? result.packages : [];
        const gameItems = Array.isArray(result?.games) ? result.games : [];

        setPackages(items);
        setGames(gameItems);

        const nextDrafts = {};
        items.forEach((pkg) => {
          nextDrafts[pkg.id] = {
            game_id: pkg.game_id ?? pkg.topup_game_id ?? pkg.game?.id ?? "",
            name: pkg.name ?? "",
            price: pkg.price ?? "",
            diamond_amount: pkg.diamond_amount ?? "",
            sku: pkg.sku ?? "",
            is_active: Boolean(pkg.is_active),
          };
        });
        setDrafts(nextDrafts);
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Unable to load packages.");
      } finally {
        setLoading(false);
      }
    }

    load();
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
        sku: createForm.sku.trim() ? createForm.sku.trim() : null,
        is_active: Boolean(createForm.is_active),
      };

      const result = await createAdminPackage(payload);
      const createdPackage = result?.package || result?.data?.package || result;

      if (createdPackage) {
        setPackages((current) => [createdPackage, ...current]);
        setDrafts((current) => ({
          ...current,
          [createdPackage.id]: {
            game_id:
              createdPackage.game_id ??
              createdPackage.topup_game_id ??
              createdPackage.game?.id ??
              "",
            name: createdPackage.name ?? "",
            price: createdPackage.price ?? "",
            diamond_amount: createdPackage.diamond_amount ?? "",
            sku: createdPackage.sku ?? "",
            is_active: Boolean(createdPackage.is_active),
          },
        }));
      }

      setCreateForm({
        game_id: "",
        name: "",
        price: "",
        diamond_amount: "",
        sku: "",
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

      const result = await updateAdminPackage(id, draft);
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

  async function deletePackage(id) {
    if (!window.confirm("Are you sure you want to delete this package?")) return;

    try {
      setError("");
      setMessage("");

      await deleteAdminPackage(id);

      setPackages((current) =>
        current.filter((item) => String(item.id) !== String(id))
      );
      setMessage("Package deleted successfully.");
    } catch (err) {
      console.error("Delete Error:", err);
      setError(err.message || "Unable to delete package.");
    }
  }

  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch =
      pkg.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(pkg.id).includes(searchQuery) ||
      String(pkg.sku).includes(searchQuery);

    const currentPkgGameId = pkg.game_id ?? pkg.topup_game_id ?? pkg.game?.id ?? "";
    const matchesGame =
      selectedGameFilter === "" || String(currentPkgGameId) === String(selectedGameFilter);

    return matchesSearch && matchesGame;
  });

  return (
    <div className="p-6 bg-[#0f1115] min-h-screen text-slate-100">
      <div className="bg-[#161920] rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-400">Management</p>
            <h1 className="mt-1 text-xl font-black text-white">Package Management</h1>
          </div>
          <button
            onClick={() => setCreating(!creating)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all"
          >
            <span>+</span> {creating ? "Close Form" : "Add New Package"}
          </button>
        </div>

        {creating && (
          <form
            onSubmit={handleCreatePackage}
            className="p-5 bg-slate-950/40 border-b border-white/5 grid gap-4 md:grid-cols-6 items-end"
          >
            <div className="grid gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Game
              </span>
              <select
                value={createForm.game_id}
                onChange={(e) =>
                  setCreateForm({ ...createForm, game_id: e.target.value })
                }
                className="w-full bg-[#0f1115] border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
                required
              >
                <option value="">Select game</option>
                {games.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Name
              </span>
              <input
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                className="w-full bg-[#0f1115] border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
                placeholder="e.g. 55 Diamonds"
                required
              />
            </div>

            <div className="grid gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Price ($)
              </span>
              <input
                type="number"
                step="any"
                value={createForm.price}
                onChange={(e) => setCreateForm({ ...createForm, price: e.target.value })}
                className="w-full bg-[#0f1115] border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
                placeholder="0.85"
                required
              />
            </div>

            <div className="grid gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Diamonds
              </span>
              <input
                type="number"
                value={createForm.diamond_amount}
                onChange={(e) =>
                  setCreateForm({ ...createForm, diamond_amount: e.target.value })
                }
                className="w-full bg-[#0f1115] border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
                placeholder="e.g. 55"
                required
              />
            </div>

            <div className="grid gap-2">
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                Flash SKU (ID)
              </span>
              <input
                type="text"
                value={createForm.sku}
                onChange={(e) => setCreateForm({ ...createForm, sku: e.target.value })}
                className="w-full bg-[#0f1115] border border-cyan-500/30 rounded-2xl px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
                placeholder="e.g. 38"
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-2.5 rounded-2xl text-sm font-semibold transition-all"
              >
                Save Package
              </button>
            </div>
          </form>
        )}

        <div className="p-4 bg-[#161920] border-b border-white/5 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-4 top-3 text-slate-500 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search sub categories or SKUs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0f1115] border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500 placeholder-slate-600"
            />
          </div>

          <select
            value={selectedGameFilter}
            onChange={(e) => setSelectedGameFilter(e.target.value)}
            className="bg-[#0f1115] border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500 min-w-[200px]"
          >
            <option value="">All Main Categories</option>
            {games.map((g) => (
              <option key={g.id} value={String(g.id)}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {message && (
          <div className="m-4 p-3 bg-emerald-500/10 text-emerald-400 text-sm rounded-2xl font-semibold border border-emerald-500/20">
            {message}
          </div>
        )}
        {error && (
          <div className="m-4 p-3 bg-rose-500/10 text-rose-400 text-sm rounded-2xl font-semibold border border-rose-500/20">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-[#0f1115]/50 text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="py-4 px-6 w-20">Order</th>
                <th className="py-4 px-4">Name</th>
                <th className="py-4 px-4">Main Category</th>
                <th className="py-4 px-4 w-28">Price ($)</th>
                <th className="py-4 px-4 w-28">Diamonds</th>
                <th className="py-4 px-4 w-28 text-cyan-400">Flash SKU</th>
                <th className="py-4 px-4 w-24 text-center">Status</th>
                <th className="py-4 px-6 w-28 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-500">
                    Loading data...
                  </td>
                </tr>
              ) : filteredPackages.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-500">
                    No matching records found
                  </td>
                </tr>
              ) : (
                filteredPackages.map((pkg, index) => {
                  const draft = drafts[pkg.id] || {};

                  return (
                    <tr key={pkg.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6 font-medium text-slate-500">{index + 1}</td>

                      <td className="py-4 px-4 font-semibold text-white">
                        <input
                          type="text"
                          value={draft.name ?? ""}
                          onChange={(e) => updateDraft(pkg.id, "name", e.target.value)}
                          className="bg-transparent hover:bg-white/5 focus:bg-[#0f1115] focus:ring-1 focus:ring-cyan-500 rounded-xl px-2 py-1.5 -ml-2 w-full outline-none transition-all text-white"
                        />
                      </td>

                      <td className="py-4 px-4 text-slate-400">
                        <select
                          value={String(draft.game_id ?? "")}
                          onChange={(e) => updateDraft(pkg.id, "game_id", e.target.value)}
                          className="bg-[#0f1115] border border-white/5 hover:border-white/20 focus:border-cyan-500 rounded-xl px-2 py-1.5 outline-none text-slate-300 w-full"
                        >
                          <option value="">None</option>
                          {games.map((g) => (
                            <option key={g.id} value={String(g.id)}>
                              {g.name || g.code}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-4 px-4">
                        <input
                          type="number"
                          step="any"
                          value={draft.price ?? ""}
                          onChange={(e) => updateDraft(pkg.id, "price", e.target.value)}
                          className="bg-transparent hover:bg-white/5 focus:bg-[#0f1115] focus:ring-1 focus:ring-cyan-500 rounded-xl px-2 py-1.5 w-20 outline-none font-medium text-white"
                        />
                      </td>

                      <td className="py-4 px-4">
                        <input
                          type="number"
                          value={draft.diamond_amount ?? ""}
                          onChange={(e) =>
                            updateDraft(pkg.id, "diamond_amount", e.target.value)
                          }
                          className="bg-transparent hover:bg-white/5 focus:bg-[#0f1115] focus:ring-1 focus:ring-cyan-500 rounded-xl px-2 py-1.5 w-20 outline-none text-white"
                        />
                      </td>

                      <td className="py-4 px-4">
                        <input
                          type="text"
                          value={draft.sku ?? ""}
                          onChange={(e) => updateDraft(pkg.id, "sku", e.target.value)}
                          placeholder="e.g. 38"
                          className="bg-[#0f1115]/60 hover:bg-white/5 border border-cyan-500/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-2 py-1.5 w-24 outline-none font-bold text-cyan-400 transition-all"
                        />
                      </td>

                      <td className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={Boolean(draft.is_active)}
                          onChange={(e) => updateDraft(pkg.id, "is_active", e.target.checked)}
                          className="w-4 h-4 rounded bg-[#0f1115] border-white/10 text-cyan-500 focus:ring-cyan-500"
                        />
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => savePackage(pkg.id)}
                            disabled={savingId === pkg.id}
                            title="Save Changes"
                            className="text-blue-400 hover:text-blue-300 disabled:opacity-40 p-1 hover:bg-blue-500/10 rounded-lg transition-all"
                          >
                            {savingId === pkg.id ? (
                              <span className="text-xs">...</span>
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="w-4 h-4"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                                />
                              </svg>
                            )}
                          </button>

                          <button
                            onClick={() => deletePackage(pkg.id)}
                            title="Delete"
                            className="text-rose-500 hover:text-rose-400 p-1 hover:bg-rose-500/10 rounded-lg transition-all"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                              className="w-4 h-4"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M14.74 9l-.346 9m-4.788 0L9.24 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PackageManagement;
