import React, { useEffect, useState } from "react";
import { createAdminGame, fetchAdminDashboard, adminApi } from "../services/adminService"; 

// 🚀 មុខងារជំនួយសម្រាប់បាញ់ទៅ Update Game តាមវិធី PATCH ទៅកាន់ Laravel
async function localUpdateAdminGame(gameId, payload) {
  const response = await adminApi.patch(`/admin/games/${encodeURIComponent(gameId)}`, payload);
  return response?.data;
}

function GameManagement() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null); // 🎯 ចាប់ ID ហ្គេមដែលកំពុងចុច Save ឬ Create
  const [creating, setCreating] = useState(false); // 🎯 បើក/បិទ Form បង្កើតហ្គេមថ្មី
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [drafts, setDrafts] = useState({}); // 🎯 រក្សាទុកទិន្នន័យកែប្រែបណ្ដោះអាសន្ន (Drafts)
  
  // 🔍 សម្រាប់មុខងារ Search
  const [searchQuery, setSearchQuery] = useState("");

  const [createForm, setCreateForm] = useState({
    name: "",
    code: "",
    is_active: true,
  });

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const result = await fetchAdminDashboard();

        const items = Array.isArray(result?.games) ? result.games : [];
        setGames(items);

        const nextDrafts = {};
        items.forEach((game) => {
          nextDrafts[game.id] = {
            name: game.name || "",
            code: game.code || "",
            is_active: game.is_active !== undefined ? Boolean(game.is_active) : true,
          };
        });
        setDrafts(nextDrafts);
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Unable to load games.");
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

  // ➕ មុខងារបង្កើតហ្គេមថ្មី (Create Game)
  async function handleCreateGame(event) {
    event.preventDefault();
    try {
      setSavingId("creating");
      setError("");
      setMessage("");

      const result = await createAdminGame({
        name: createForm.name.trim(),
        code: createForm.code.trim(),
        is_active: createForm.is_active,
      });

      const createdGame = result?.game || result?.data?.game || result;
      if (createdGame) {
        setGames((current) => [createdGame, ...current]);
        
        setDrafts((current) => ({
          ...current,
          [createdGame.id]: {
            name: createdGame.name || "",
            code: createdGame.code || "",
            is_active: createdGame.is_active !== undefined ? Boolean(createdGame.is_active) : true,
          },
        }));
      }

      setCreateForm({ name: "", code: "", is_active: true });
      setMessage("Game created successfully.");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to create game.");
    } finally {
      setSavingId(null);
    }
  }

  // 💾 មុខងាររក្សាទុកទិន្នន័យកែប្រែ (Save Game)
  async function saveGame(id) {
    const draft = drafts[id];
    try {
      setSavingId(id);
      setError("");
      setMessage("");

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

  // 🗑️ មុខងារលុបហ្គេមដាច់ពី Database (Delete Game Fix)
 async function deleteGame(id) {
    if (!window.confirm("Are you sure you want to delete this game?")) return;
    try {
      setError("");
      setMessage("");

      // 🚀 បាញ់ទៅកាន់ /api/admin/games/{game} ចំទម្រង់ apiResource របស់ Laravel
      await adminApi.delete(`/admin/games/${id}`); 

      // 💻 បើលុបជោគជ័យ ទើបយើងកាត់ចេញពី UI React
      setGames((current) => current.filter((item) => item.id !== id));
      setMessage("Game deleted successfully.");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to delete game.");
    }
  }

  // 🔍 មុខងារចម្រាញ់ទិន្នន័យស្វែងរក (Filtering logic)
  const filteredGames = games.filter((game) => {
    return game.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
           game.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           String(game.id).includes(searchQuery);
  });

  return (
    <div className="p-6 bg-[#0f1115] min-h-screen text-slate-100">
      
      {/* 📦 កាតមេស្ទីលងងឹត */}
      <div className="bg-[#161920] rounded-3xl border border-white/5 overflow-hidden">
        
        {/* 📋 Header Section */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-400">Management</p>
            <h1 className="mt-1 text-xl font-black text-white">Game Management</h1>
          </div>
          <button
            onClick={() => setCreating(!creating)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all"
          >
            <span>+</span> {creating ? "Close Form" : "Add Main Category"}
          </button>
        </div>

        {/* ➕ Form បញ្ចូលហ្គេមថ្មី */}
        {creating && (
          <form onSubmit={handleCreateGame} className="p-5 bg-slate-950/40 border-b border-white/5 grid gap-4 md:grid-cols-4 items-end">
            <div className="grid gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Game Name</span>
              <input
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                className="w-full bg-[#0f1115] border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
                placeholder="e.g. Mobile Legends"
                required
              />
            </div>
            <div className="grid gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Game Code</span>
              <input
                value={createForm.code}
                onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
                className="w-full bg-[#0f1115] border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
                placeholder="e.g. mlbb"
                required
              />
            </div>
            <div className="flex items-center gap-3 bg-[#0f1115] border border-white/10 rounded-2xl px-4 py-3 h-[45px] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={createForm.is_active}
                onChange={(e) => setCreateForm({ ...createForm, is_active: e.target.checked })}
                className="w-4 h-4 rounded bg-[#0f1115] border-white/10 text-cyan-500 focus:ring-cyan-500"
              />
              <span className="text-sm font-semibold text-slate-300">Active Status</span>
            </div>
            <div>
              <button 
                type="submit" 
                disabled={savingId === "creating"}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-2.5 rounded-2xl text-sm font-semibold transition-all disabled:opacity-50"
              >
                {savingId === "creating" ? "Saving..." : "Save Category"}
              </button>
            </div>
          </form>
        )}

        {/* 🔍 របារស្វែងរក */}
        <div className="p-4 bg-[#161920] border-b border-white/5">
          <div className="relative w-full md:w-1/3">
            <span className="absolute left-4 top-3 text-slate-500 text-sm"></span>
            <input
              type="text"
              placeholder="Search main categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0f1115] border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500 placeholder-slate-600"
            />
          </div>
        </div>

        {/* 📢 Message Alerts */}
        {message && <div className="m-4 p-3 bg-emerald-500/10 text-emerald-400 text-sm rounded-2xl font-semibold border border-emerald-500/20">{message}</div>}
        {error && <div className="m-4 p-3 bg-rose-500/10 text-rose-400 text-sm rounded-2xl font-semibold border border-rose-500/20">{error}</div>}

        {/* 📊 តារាងទិន្នន័យ (Data Table) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-[#0f1115]/50 text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="py-4 px-6 w-24">Order</th>
                <th className="py-4 px-4">Name</th>
                <th className="py-4 px-4">Code</th>
                <th className="py-4 px-4 w-32 text-center">Status</th>
                <th className="py-4 px-6 w-28 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm text-slate-300">
              {loading ? (
                <tr><td colSpan="5" className="py-8 text-center text-slate-500">Loading data...</td></tr>
              ) : filteredGames.length === 0 ? (
                <tr><td colSpan="5" className="py-8 text-center text-slate-500">No matching records found</td></tr>
              ) : (
                filteredGames.map((game, index) => {
                  const draft = drafts[game.id] || {};
                  return (
                    <tr key={game.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Order */}
                      <td className="py-4 px-6 font-medium text-slate-500">{index + 1}</td>
                      
                      {/* Name Input */}
                      <td className="py-4 px-4 font-semibold text-white">
                        <input
                          type="text"
                          value={draft.name ?? ""}
                          onChange={(e) => updateDraft(game.id, "name", e.target.value)}
                          className="bg-transparent hover:bg-white/5 focus:bg-[#0f1115] focus:ring-1 focus:ring-cyan-500 rounded-xl px-2 py-1.5 -ml-2 w-full outline-none transition-all text-white"
                        />
                      </td>

                      {/* Code Input */}
                      <td className="py-4 px-4 text-slate-400">
                        <input
                          type="text"
                          value={draft.code ?? ""}
                          onChange={(e) => updateDraft(game.id, "code", e.target.value)}
                          className="bg-transparent hover:bg-white/5 focus:bg-[#0f1115] focus:ring-1 focus:ring-cyan-500 rounded-xl px-2 py-1.5 -ml-2 w-full outline-none transition-all text-slate-300 font-mono"
                        />
                      </td>

                      {/* Status Checkbox */}
                      <td className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={Boolean(draft.is_active)}
                          onChange={(e) => updateDraft(game.id, "is_active", e.target.checked)}
                          className="w-4 h-4 rounded bg-[#0f1115] border-white/10 text-cyan-500 focus:ring-cyan-500"
                        />
                      </td>

                      {/* Actions: Edit/Save & Delete Icons */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {/* ប៊ូតុង Save (រូបខ្មៅដៃ) */}
                          <button
                            onClick={() => saveGame(game.id)}
                            disabled={savingId === game.id}
                            title="Save Changes"
                            className="text-blue-400 hover:text-blue-300 disabled:opacity-40 p-1 hover:bg-blue-500/10 rounded-lg transition-all"
                          >
                            {savingId === game.id ? (
                              <span className="text-xs">...</span>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                              </svg>
                            )}
                          </button>

                          {/* ប៊ូតុង Delete (រូបធុងសម្រាម) */}
                          <button
                            onClick={() => deleteGame(game.id)}
                            title="Delete"
                            className="text-rose-500 hover:text-rose-400 p-1 hover:bg-rose-500/10 rounded-lg transition-all"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.24 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
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

export default GameManagement;