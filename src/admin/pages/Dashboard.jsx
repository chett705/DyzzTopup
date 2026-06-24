import { useEffect, useState } from "react";
import { fetchAdminDashboard } from "../services/adminService";

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 🎯 1. រក្សាទុកកាក់ទុន Wallet នៅក្នុង React State ផ្ទាល់ (ងាយស្រួលកែប្រែ ឬតេស្ត)
  const [walletBalance, setWalletBalance] = useState(6.00); 

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const result = await fetchAdminDashboard();
        setData(result);
      } catch (err) {
        setError(err.message || "Unable to load dashboard.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const stats = data?.stats || data?.summary || {};
  const ordersList = data?.orders || [];

  // 🎯 2. មុខងាររាប់ចំនួន Status ដោយស្វ័យប្រវត្តិចេញពី Array `orders` នៅលើ React (No Laravel Needed)
  const countByStatus = (statusName) => {
    return ordersList.filter(order => order.status?.toLowerCase() === statusName.toLowerCase()).length;
  };

  // លក្ខខណ្ឌព្រមានពេលលុយទុនទាបជាង $10
  const isLowBalance = walletBalance < 10.00;

  return (
    <div className="p-6 bg-[#0f1115] min-h-screen text-slate-100 font-sans">
      
      {/* 🌟 Dashboard Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-400 font-bold">System Overview</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-white">Dashboard</h1>
        </div>
        
        {/* 💰 Reseller Wallet Quick Indicator */}
        <div className={`px-5 py-2.5 rounded-2xl border backdrop-blur-md flex items-center gap-3 transition-all ${
          isLowBalance 
            ? "bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse" 
            : "bg-white/5 border-white/5 text-slate-300"
        }`}>
          <span className="text-lg">💳</span>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Reseller Wallet</p>
            <p className="text-sm font-black">${walletBalance.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* 🔔 Low Balance Alert Panel (React Native Checking) */}
      {isLowBalance && (
        <div className="mb-6 rounded-3xl border border-rose-500/20 bg-gradient-to-r from-rose-500/10 to-transparent p-5 flex items-start gap-4 shadow-lg shadow-rose-950/20">
          <div className="bg-rose-500/20 w-10 h-10 rounded-2xl flex items-center justify-center text-rose-400 border border-rose-500/30 text-lg flex-shrink-0">
            ⚠️
          </div>
          <div>
            <h3 className="text-sm font-black text-rose-400 tracking-wide">Reseller Wallet Balance Low!</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              ទឹកប្រាក់ទុនបច្ចុប្បន្នគឺសល់ត្រឹមតែ <span className="text-rose-400 font-bold">${walletBalance.toFixed(2)}</span> ប៉ុណ្ណោះ (ទាបជាង $10.00)។ សូមប្រញាប់ទាក់ទងទៅកាន់ Flash Topup Support ដើម្បីបញ្ចូលលុយបន្ថែម ការពារកុំឱ្យគាំង Order របស់ម៉ូយៗ!
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="animate-pulse rounded-3xl border border-white/5 bg-[#161920] p-6 h-32" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5 text-rose-400 font-medium">
          {error}
        </div>
      ) : (
        <>
          {/* 📊 Main Metrics Row */}
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4 mb-6">
            <StatCard label="Total Games" value={stats.games ?? data?.games?.length ?? 0} icon="🎮" color="from-amber-500/10 to-transparent" borderColor="hover:border-amber-500/20" />
            <StatCard label="Active Packages" value={stats.packages ?? data?.packages?.length ?? 0} icon="📦" color="from-indigo-500/10 to-transparent" borderColor="hover:border-indigo-500/20" />
            <StatCard label="Success Orders" value={stats.orders_success ?? countByStatus("success") ?? stats.orders ?? 0} icon="✅" color="from-blue-500/10 to-transparent" borderColor="hover:border-blue-500/20" />
            <StatCard label="Total Revenue" value={stats.revenue ?? "$0.00"} icon="💰" color="from-emerald-500/10 to-transparent" borderColor="hover:border-emerald-500/20" isRevenue={true} />
          </div>

          {/* 📈 Daily Status Tracker (គណនា និងរាប់ទិន្នន័យនៅលើ React ផ្ទាល់) */}
          <div className="mb-8">
            <div className="mb-4">
              <h2 className="text-xs uppercase tracking-[0.25em] font-black text-slate-400">Daily Status Tracker</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">តាមដានស្ថានភាពលម្អិតនៃរាល់គ្រប់ Orders ទាំងអស់ដែលទាញចេញពី Backend</p>
            </div>
            
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
              <TrackerCard label="Pending Orders" value={countByStatus("pending")} color="border-amber-500/20 bg-amber-500/5 text-amber-400" desc="រង់ចាំអតិថិជនបង់លុយ" />
              <TrackerCard label="Paid Orders" value={countByStatus("paid")} color="border-cyan-500/20 bg-cyan-500/5 text-cyan-400" desc="បានបង់លុយរួចរាល់" />
              <TrackerCard label="Processing" value={countByStatus("processing")} color="border-blue-500/20 bg-blue-500/5 text-blue-400" desc="កំពុងបញ្ចូលគ្រាប់ពេជ្រ" />
              <TrackerCard label="Success" value={countByStatus("success")} color="border-emerald-500/20 bg-emerald-500/5 text-emerald-400" desc="ជោគជ័យ បញ្ចប់ការងារ" />
              <TrackerCard label="Failed / Disputes" value={countByStatus("failed")} color="border-rose-500/20 bg-rose-500/5 text-rose-400" desc="លុយគាំង ឬជួបបញ្ហា" />
            </div>
          </div>

          {/* 📉 Visualizations Panels */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Transaction Levels" subtitle="Monthly data trends Overview">
              <TransactionLineChart orders={ordersList} />
            </Panel>

            <Panel title="Most Popular Products" subtitle="Ranks based on order frequency">
              <PopularProductsBarChart orders={ordersList} />
            </Panel>

            <Panel title="Marketing Statistics" subtitle="Product type distribution percentage">
              <MarketingDonutChart 
                ordersCount={ordersList.length}
                packagesCount={data?.packages?.length || 0}
                gamesCount={data?.games?.length || 0}
              />
            </Panel>

            <Panel title="Recent Activities" subtitle="Latest processed system transactions">
              <ListRows items={ordersList} />
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}

/* ==========================================================================
   🎨 PREMIUM DARK UI SUB-COMPONENTS
   ========================================================================== */

function StatCard({ label, value, icon, color, borderColor, isRevenue }) {
  return (
    <div className={`rounded-3xl border border-white/5 bg-[#161920] p-6 shadow-lg transition-all duration-300 bg-gradient-to-br ${color} ${borderColor} hover:-translate-y-1`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</p>
        <span className="text-xl bg-white/5 w-10 h-10 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner">{icon}</span>
      </div>
      <p className={`mt-4 text-3xl font-black tracking-tight ${isRevenue ? "text-emerald-400 drop-shadow-[0_4px_12px_rgba(16,185,129,0.2)]" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

function TrackerCard({ label, value, color, desc }) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm flex flex-col justify-between transition-all hover:scale-[1.02] ${color}`}>
      <div>
        <p className="text-[10px] font-black uppercase tracking-wider opacity-80">{label}</p>
        <p className="text-xs opacity-60 font-medium mt-0.5">{desc}</p>
      </div>
      <p className="mt-4 text-3xl font-black tracking-tight">{value}</p>
    </div>
  );
}

function Panel({ title, subtitle, children }) {
  return (
    <div className="rounded-3xl border border-white/5 bg-[#161920] p-6 shadow-2xl flex flex-col justify-between w-full relative overflow-hidden">
      <div className="mb-5">
        <h2 className="text-xs uppercase tracking-[0.25em] font-black text-slate-400">{title}</h2>
        {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center justify-center min-h-[240px] w-full bg-[#0f1115]/40 rounded-2xl border border-white/[0.02] p-4">
        {children}
      </div>
    </div>
  );
}

function TransactionLineChart({ orders }) {
  const baseCount = orders.length || 5;
  const h1 = Math.min(100, Math.max(20, baseCount * 4));
  const h2 = Math.min(100, Math.max(30, baseCount * 3));
  const h3 = Math.min(100, Math.max(40, baseCount * 2));

  return (
    <div className="w-full h-48 flex flex-col justify-between">
      <svg viewBox="0 0 300 120" className="w-full overflow-visible">
        <line x1="0" y1="20" x2="300" y2="20" stroke="rgba(255,255,255,0.03)" strokeDasharray="4" />
        <line x1="0" y1="60" x2="300" y2="60" stroke="rgba(255,255,255,0.03)" strokeDasharray="4" />
        <line x1="0" y1="100" x2="300" y2="100" stroke="rgba(255,255,255,0.03)" strokeDasharray="4" />
        
        <path d={`M10,90 Q50,${h1} 90,65 T170,40 T250,${h3 - 10} T290,30`} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
        <path d={`M10,98 Q50,85 90,${h2} T170,55 T250,40 T290,42`} fill="none" stroke="#ea580c" strokeWidth="3" strokeLinecap="round" />
        <path d={`M10,104 Q50,95 90,85 T170,${h3} T250,55 T290,58`} fill="none" stroke="#ca8a04" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <div className="flex justify-between text-[10px] text-slate-500 font-bold px-2 mt-2 tracking-wider uppercase">
        <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
      </div>
    </div>
  );
}

function PopularProductsBarChart({ orders }) {
  const fallbackBars = [
    { name: "Unknown", count: 18 },
    { name: "Weekly Pass", count: 14 },
    { name: "Diamonds", count: 12 },
    { name: "Bundle", count: 9 },
    { name: "Top Up", count: 6 },
  ];

  const grouped = new Map();
  (orders || []).forEach((order) => {
    const name = order?.package?.name || order?.package_name || "Unknown";
    const current = grouped.get(name) || { name, count: 0 };
    current.count += 1;
    grouped.set(name, current);
  });

  const activeData = grouped.size > 0 
    ? Array.from(grouped.values()).sort((a, b) => b.count - a.count).slice(0, 5)
    : fallbackBars;

  const maxCount = Math.max(...activeData.map((item) => item.count || 1), 1);
  const colors = [
    "bg-gradient-to-t from-cyan-600 to-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]",
    "bg-gradient-to-t from-fuchsia-600 to-fuchsia-400 shadow-[0_0_15px_rgba(232,121,249,0.3)]",
    "bg-gradient-to-t from-amber-600 to-amber-400 shadow-[0_0_15px_rgba(251,113,133,0.3)]",
    "bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]",
    "bg-gradient-to-t from-rose-600 to-rose-400 shadow-[0_0_15px_rgba(251,113,133,0.3)]",
  ];

  return (
    <div className="w-full">
      <div className="flex items-end justify-around gap-4 border-b border-white/5 pb-4 pt-2 min-h-[160px]">
        {activeData.map((item, i) => {
          const count = item.count || 0;
          const dynamicHeight = Math.max(20, (count / maxCount) * 120);

          return (
            <div key={i} className="group relative flex flex-col items-center flex-1 max-w-[65px]">
              <div className={`${colors[i % colors.length]} w-full rounded-t-xl transition-all duration-300 hover:scale-105`} style={{ height: `${dynamicHeight}px` }} />
              <span className="mt-3 w-full truncate text-center text-[10px] font-black text-slate-300 tracking-wide">{item.name}</span>
              <span className="text-[9px] text-slate-500 font-bold mt-0.5">{count} Sells</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MarketingDonutChart({ ordersCount, packagesCount, gamesCount }) {
  const total = ordersCount + packagesCount + gamesCount || 100;
  const pOrders = Math.round((ordersCount / total) * 100) || 35;
  const pPackages = Math.round((packagesCount / total) * 100) || 45;
  const pGames = 100 - pOrders - pPackages;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-around w-full gap-6">
      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90 filter drop-shadow-md">
          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#1d4ed8" strokeWidth="4.2" strokeDasharray={`${pOrders} 100`} strokeDashoffset="0" strokeLinecap="round" />
          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#047857" strokeWidth="4.2" strokeDasharray={`${pPackages} 100`} strokeDashoffset={`-${pOrders}`} strokeLinecap="round" />
          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#b45309" strokeWidth="4.2" strokeDasharray={`${pGames} 100`} strokeDashoffset={`-${pOrders + pPackages}`} strokeLinecap="round" />
        </svg>
        <div className="absolute text-center">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Total</p>
          <p className="text-xl font-black text-white">{total === 100 ? 0 : total}</p>
        </div>
      </div>
      
      <div className="flex flex-col gap-2.5 text-xs font-bold text-slate-300">
        <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 px-4 py-2 rounded-xl min-w-[150px]"><span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.6)]"/> {pOrders}% Orders</div>
        <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 px-4 py-2 rounded-xl min-w-[150px]"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.6)]"/> {pPackages}% Packages</div>
        <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 px-4 py-2 rounded-xl min-w-[150px]"><span className="w-2.5 h-2.5 rounded-full bg-amber-600 shadow-[0_0_8px_rgba(245,158,11,0.6)]"/> {pGames}% Games</div>
      </div>
    </div>
  );
}

function ListRows({ items }) {
  if (!items.length) {
    return <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">No active operations found.</p>;
  }

  return (
    <div className="grid gap-3 w-full">
      {items.slice(0, 3).map((item, index) => (
        <div key={index} className="rounded-2xl border border-white/5 bg-[#0f1115]/60 p-3.5 flex justify-between items-center transition hover:border-white/10 hover:bg-[#0f1115]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/20 flex items-center justify-center font-black text-xs text-cyan-400">
              #{index + 1}
            </div>
            <div>
              <p className="font-bold text-white text-sm tracking-wide">{item.order_no || `Order ID: ${item.id}`}</p>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">{item.package?.name || "Game Token Topup"}</p>
            </div>
          </div>
          <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg shadow-sm">
            {item.status || "Success"}
          </span>
        </div>
      ))}
    </div>
  );
}

export default Dashboard;