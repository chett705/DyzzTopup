import { useEffect, useState } from "react";
import { fetchAdminDashboard, updateAdminPackage } from "../services/adminService";

function PackageManagement() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [drafts, setDrafts] = useState({});

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const result = await fetchAdminDashboard();
        const items = Array.isArray(result?.packages) ? result.packages : [];
        if (!ignore) {
          setPackages(items);
          const nextDrafts = {};
          items.forEach((pkg) => {
            nextDrafts[pkg.id] = {
              name: pkg.name ?? "",
              price: pkg.price ?? "",
              diamond_amount: pkg.diamond_amount ?? "",
              is_active: Boolean(pkg.is_active),
            };
          });
          setDrafts(nextDrafts);
        }
      } catch (err) {
        if (!ignore) setError(err.message || "Unable to load packages.");
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

  async function savePackage(id) {
    const draft = drafts[id];
    try {
      setSavingId(id);
      setError("");
      const result = await updateAdminPackage(id, draft);
      const updated = result?.package || result?.data?.package || result;
      if (updated) {
        setPackages((current) =>
          current.map((item) => (String(item.id) === String(id) ? { ...item, ...updated } : item))
        );
      }
    } catch (err) {
      setError(err.message || "Unable to update package.");
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
              <article key={pkg.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                  <label className="grid gap-2">
                    <span className="text-xs uppercase tracking-[0.25em] text-slate-400">Name</span>
                    <input
                      value={draft.name ?? ""}
                      onChange={(e) => updateDraft(pkg.id, "name", e.target.value)}
                      className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-cyan-400/60"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs uppercase tracking-[0.25em] text-slate-400">Price</span>
                    <input
                      value={draft.price ?? ""}
                      onChange={(e) => updateDraft(pkg.id, "price", e.target.value)}
                      className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-cyan-400/60"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs uppercase tracking-[0.25em] text-slate-400">Diamonds</span>
                    <input
                      value={draft.diamond_amount ?? ""}
                      onChange={(e) => updateDraft(pkg.id, "diamond_amount", e.target.value)}
                      className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-cyan-400/60"
                    />
                  </label>
                  <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={Boolean(draft.is_active)}
                      onChange={(e) => updateDraft(pkg.id, "is_active", e.target.checked)}
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
