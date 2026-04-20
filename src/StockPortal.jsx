import { useState, useMemo, useEffect } from "react";
import {
  Search, Package, Clock, AlertTriangle, Plus, ChevronRight, Eye, Edit3,
  Check, X, TrendingDown, Truck, FileText, Upload, Camera, Loader,
  ArrowLeft, MapPin, Zap, Send, Scan
} from "lucide-react";
import { useStock } from "./hooks/useStock";

// ─────────────────────────────────────────────────────────────
// MOCK DATA — Orders only (Stock now comes from Supabase)
// ─────────────────────────────────────────────────────────────

const OPEN_ORDERS = [
  { id: "ORD-690417-01", date: "17/04/2569", customer: "วัยรุ่นสกรีน", destination: "คลอง 4", status: "partial",
    items: [
      { shade: "ดำซัลเฟอร์", rolls: 20, kg: 20, status: "ready" },
      { shade: "ขาว", rolls: 10, kg: 10, status: "waiting", note: "รอโรงย้อม" },
      { shade: "ดำรีแอคทีฟ", rolls: 10, kg: 10, status: "partial", fulfilled: 8 },
      { shade: "Bio ดำ", rolls: 10, kg: 10, status: "partial", fulfilled: 7 },
      { shade: "Bio ขาว", rolls: 5, kg: 5, status: "ready" },
    ]},
  { id: "ORD-690416-02", date: "16/04/2569", customer: "วัยรุ่นสกรีน", destination: "โรงงาน", status: "shipped",
    items: [
      { shade: "ดำ", rolls: 12, kg: 12, status: "shipped" },
      { shade: "เทา", rolls: 10, kg: 10, status: "shipped" },
    ]},
];

export default function KnitspeedPortal() {
  const [role, setRole] = useState("customer");
  const [view, setView] = useState("stock");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState({});
  const [showSendOrder, setShowSendOrder] = useState(false);
  const [orderSent, setOrderSent] = useState(false);

  // Live stock data from Supabase
  const { groups: stockGroups, loading: stockLoading, error: stockError, refresh } = useStock();

  // Filter stock for search
  const filteredGroups = useMemo(() => {
    if (!stockGroups || !search.trim()) return stockGroups || [];
    
    const q = search.toLowerCase();
    return stockGroups.map(group => ({
      ...group,
      rows: group.rows.filter(row =>
        row.shade.toLowerCase().includes(q) ||
        row.code.toLowerCase().includes(q) ||
        group.title.toLowerCase().includes(q)
      )
    })).filter(group => group.rows.length > 0);
  }, [stockGroups, search]);

  const cartCount = Object.values(cart).reduce((a, b) => a + (b || 0), 0);
  const cartItems = Object.keys(cart).filter(k => cart[k] > 0).length;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900" style={{ fontFamily: "'Noto Sans Thai', 'IBM Plex Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Fraunces:ital,wght@0,400;0,600;0,700;1,400&display=swap');
        .font-display { font-family: 'Fraunces', Georgia, serif; font-feature-settings: 'ss01'; }
        .font-mono { font-family: 'IBM Plex Mono', ui-monospace, monospace; font-variant-numeric: tabular-nums; }
        .tabular { font-variant-numeric: tabular-nums; }
        .paper-grain {
          background-color: #fafaf7;
          background-image:
            radial-gradient(circle at 20% 30%, rgba(120,53,15,0.02) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(120,53,15,0.015) 0%, transparent 50%);
        }
        @keyframes slide-up { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.25s ease-out; }
      `}</style>

      {/* ─── HEADER ─── */}
      <header className="border-b-2 border-stone-900 paper-grain sticky top-0 z-20 bg-stone-50">
        <div className="max-w-[1400px] mx-auto px-8 py-5">
          <div className="flex items-start justify-between gap-8">
            <div>
              <div className="flex items-baseline gap-4 mb-1">
                <h1 className="font-display text-3xl font-bold tracking-tight">Knitspeed / GSC</h1>
                <span className="text-xs font-mono text-stone-500 uppercase tracking-widest">พอร์ทัลสต๊อกผ้า · v0.4</span>
              </div>
              <p className="text-sm text-stone-600">ระบบเช็คสต๊อกผ้า + ริบ แบบเรียลไทม์ <span className="text-stone-400 font-mono text-xs">· Real-time fabric & rib inventory</span></p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-stone-500 uppercase tracking-wider mr-1 hidden md:inline">เข้าใช้งานในฐานะ</span>
              <button
                onClick={() => { setRole("customer"); setView("stock"); }}
                className={`px-4 py-2 text-sm font-medium border-2 transition-all ${role === "customer" ? "bg-stone-900 text-stone-50 border-stone-900" : "bg-transparent text-stone-600 border-stone-300 hover:border-stone-900"}`}
              >
                <div className="text-left">
                  <div className="text-[10px] uppercase tracking-widest opacity-60">ลูกค้าพรีเมียม · Read</div>
                  <div>แบงค์ / Fern</div>
                </div>
              </button>
              <button
                onClick={() => { setRole("provider"); setView("stock"); }}
                className={`px-4 py-2 text-sm font-medium border-2 transition-all ${role === "provider" ? "bg-amber-700 text-stone-50 border-amber-700" : "bg-transparent text-stone-600 border-stone-300 hover:border-amber-700"}`}
              >
                <div className="text-left">
                  <div className="text-[10px] uppercase tracking-widest opacity-60">ผู้ให้ข้อมูล · Edit</div>
                  <div>Gift · Knitspeed</div>
                </div>
              </button>
            </div>
          </div>

          <nav className="flex gap-6 mt-5 -mb-[2px]">
            {[
              { id: "stock", labelTh: "สต๊อก", labelEn: "Stock", icon: Package },
              { id: "orders", labelTh: "คำสั่งซื้อ", labelEn: "Orders", icon: FileText },
              ...(role === "provider" ? [
                { id: "admin", labelTh: "กรอกข้อมูล", labelEn: "Data Entry", icon: Edit3 },
                { id: "ocr", labelTh: "สแกนบิล", labelEn: "OCR Invoice", icon: Scan },
              ] : []),
            ].map(tab => {
              const Icon = tab.icon;
              const active = view === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setView(tab.id)}
                  className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-all ${active ? "border-stone-900 text-stone-900" : "border-transparent text-stone-500 hover:text-stone-900"}`}
                >
                  <Icon size={16} strokeWidth={1.5} />
                  <span className="text-sm font-medium">{tab.labelTh}</span>
                  <span className="text-xs text-stone-400 font-mono">· {tab.labelEn}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* ─── MAIN ─── */}
      <main className={`max-w-[1400px] mx-auto px-8 py-8 ${role === "customer" && cartCount > 0 && view === "stock" ? "pb-32" : ""}`}>
        {view === "stock" && (
          <StockView 
            role={role} 
            search={search} 
            setSearch={setSearch} 
            groups={filteredGroups}
            loading={stockLoading}
            error={stockError}
            refresh={refresh}
            cart={cart} 
            setCart={setCart} 
          />
        )}
        {view === "orders" && <OrdersView role={role} />}
        {view === "admin" && role === "provider" && <AdminView />}
        {view === "ocr" && role === "provider" && <OCRView />}
      </main>

      {/* ─── FOOTER ─── */}
      <footer className={`border-t border-stone-200 py-6 paper-grain ${role === "customer" && cartCount > 0 && view === "stock" ? "mb-20" : "mt-16"}`}>
        <div className="max-w-[1400px] mx-auto px-8 flex items-center justify-between text-xs font-mono text-stone-500">
          <span>KNITSPEED CO. · GSC TEXTILES · {role === "customer" ? "โหมดอ่านอย่างเดียว" : "โหมดกรอกข้อมูล"}</span>
          <span className="uppercase tracking-widest">Live Data · Supabase v0.4</span>
        </div>
      </footer>

      {/* ─── STICKY CART + MODALS ─── */}
      {role === "customer" && cartCount > 0 && view === "stock" && !showSendOrder && (
        <div className="fixed bottom-0 left-0 right-0 bg-stone-900 text-stone-50 border-t-4 border-amber-500 z-30 animate-slide-up">
          <div className="max-w-[1400px] mx-auto px-8 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-6 min-w-0">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-stone-400">ตะกร้าคำสั่งซื้อ · Draft Order</div>
                <div className="font-mono text-lg">
                  {cartCount} <span className="text-stone-400 text-sm">พับ</span> ·{" "}
                  {cartItems} <span className="text-stone-400 text-sm">รายการ</span>
                </div>
              </div>
              <div className="text-xs text-stone-400 hidden md:block max-w-md">
                ส่งคำสั่งซื้อแทนการพิมพ์ใน LINE · No more free-text orders
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setCart({})} className="px-4 py-2 text-sm text-stone-400 hover:text-stone-50 transition">ล้าง</button>
              <button
                onClick={() => setShowSendOrder(true)}
                className="px-6 py-3 bg-amber-500 text-stone-900 font-semibold text-sm hover:bg-amber-400 transition flex items-center gap-2"
              >
                ตรวจสอบ & ส่งคำสั่ง
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {showSendOrder && (
        <SendOrderModal
          cart={cart}
          setCart={setCart}
          onClose={() => setShowSendOrder(false)}
          onSent={() => {
            setOrderSent(true);
            setShowSendOrder(false);
            setCart({});
            setTimeout(() => setOrderSent(false), 4000);
          }}
        />
      )}

      {orderSent && (
        <div className="fixed bottom-8 right-8 z-50 bg-emerald-700 text-white px-6 py-4 border-2 border-emerald-900 animate-slide-up">
          <div className="flex items-center gap-3">
            <Check size={20} strokeWidth={2.5} />
            <div>
              <div className="font-semibold">ส่งคำสั่งซื้อเรียบร้อย · Order sent to Gift</div>
              <div className="text-xs text-emerald-100 font-mono">ORD-690417-NEW</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STOCK VIEW — NOW WITH LIVE SUPABASE DATA
// ─────────────────────────────────────────────────────────────

function StockView({ role, search, setSearch, groups, loading, error, refresh, cart, setCart }) {
  // Handle loading and error states
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Loader size={24} className="mx-auto mb-4 animate-spin text-stone-400" />
          <div className="text-stone-500 mb-2">กำลังโหลดข้อมูลสต๊อก...</div>
          <div className="text-xs font-mono text-stone-400">Loading stock data from Supabase</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-2 border-red-700 bg-red-50 p-8 text-center">
        <AlertTriangle size={32} className="mx-auto mb-4 text-red-700" />
        <div className="text-red-900 font-semibold mb-2">ข้อผิดพลาดในการโหลดข้อมูล</div>
        <div className="text-red-700 text-sm mb-4">{error}</div>
        <div className="text-xs text-red-600 mb-4">ตรวจสอบการเชื่อมต่อ Supabase และ .env.local</div>
        <button 
          onClick={refresh}
          className="px-4 py-2 bg-red-700 text-white text-sm font-medium hover:bg-red-800 transition"
        >
          ลองใหม่ · Retry
        </button>
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="text-center py-16 text-stone-500">
        <Package size={32} className="mx-auto mb-4 text-stone-300" />
        <div>ไม่พบข้อมูลสต๊อก</div>
        <div className="text-xs font-mono text-stone-400 mt-1">No stock data found</div>
        <button 
          onClick={refresh}
          className="mt-4 px-4 py-2 border border-stone-300 text-stone-600 text-sm hover:border-stone-900 transition"
        >
          รีเฟรช · Refresh
        </button>
      </div>
    );
  }

  const updateCart = (key, delta) => {
    setCart(c => {
      const next = { ...c };
      const val = Math.max(0, (next[key] || 0) + delta);
      if (val === 0) delete next[key];
      else next[key] = val;
      return next;
    });
  };

  // Calculate totals from live data
  const readyTotal = groups.reduce((sum, g) => sum + g.rows.reduce((a, r) => a + (r.readyRolls || 0), 0), 0);
  const dyeTotal = groups.reduce((sum, g) => sum + g.rows.reduce((a, r) => a + (r.dyeRolls || 0), 0), 0);
  const shortCount = groups.reduce((sum, g) => sum + g.rows.filter(r => (r.readyRolls || 0) > 0 && (r.readyRib || 0) === 0).length, 0);
  const incomingCount = groups.reduce((sum, g) => sum + g.rows.filter(r => (r.dyeRolls || 0) > 0 || (r.dyeRib || 0) > 0).length, 0);

  return (
    <div>
      {/* ─── KPI STRIP ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-2 border-stone-900 mb-8 bg-white">
        <KPI labelTh="พร้อมส่งทั้งหมด" labelEn="Ready to Ship" value={readyTotal} unit="พับ" />
        <KPI labelTh="อยู่โรงย้อม" labelEn="At Dye-house" value={dyeTotal} unit="พับ" bordered />
        <KPI labelTh="ริบขาด" labelEn="Rib Short" value={shortCount} unit="รายการ" bordered alert={shortCount > 0} />
        <KPI labelTh="กำลังมา" labelEn="Incoming" value={incomingCount} unit="รายการ" bordered />
      </div>

      {/* ─── SEARCH ─── */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 flex items-center gap-3 border-2 border-stone-900 bg-white px-4 py-2.5">
          <Search size={18} strokeWidth={1.5} className="text-stone-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาตามรหัสผ้า, สี, หรือเบอร์ด้าย · เช่น C-20 ดำซัลเฟอร์"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-stone-400"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-stone-400 hover:text-stone-900"><X size={16} /></button>
          )}
        </div>
        <div className="hidden lg:flex items-center gap-2 text-[10px] font-mono text-stone-500 uppercase tracking-widest">
          <span className="w-2 h-2 bg-emerald-600"></span>พร้อม
          <span className="w-2 h-2 bg-amber-500 ml-3"></span>ริบขาด
          <span className="w-2 h-2 bg-red-700 ml-3"></span>หมด
        </div>
      </div>

      {/* ─── LIVE DATA TABLES ─── */}
      <section className="mb-12">
        <div className="flex items-baseline justify-between mb-3 pb-2 border-b-2 border-stone-900">
          <div>
            <h2 className="font-display text-xl font-bold">สต๊อกปัจจุบัน · ข้อมูลจาก Supabase</h2>
            <p className="text-xs font-mono text-stone-500 uppercase tracking-widest">Live Stock Data · Real-time from database</p>
          </div>
          <button 
            onClick={refresh}
            className="text-xs font-mono uppercase tracking-widest text-stone-500 hover:text-stone-900 border border-stone-300 hover:border-stone-900 px-3 py-1 transition"
          >
            รีเฟรช · Refresh
          </button>
        </div>

        {/* Group legend */}
        <div className="grid grid-cols-2 gap-0 mb-6 border-2 border-stone-900 bg-white text-xs">
          <div className="p-3 flex items-center gap-2">
            <div className="w-3 h-3 bg-stone-900"></div>
            <span className="font-medium">พร้อมส่ง</span>
            <span className="text-stone-500 font-mono text-[10px] uppercase tracking-widest">Ready to ship</span>
          </div>
          <div className="p-3 flex items-center gap-2 border-l-2 border-stone-900 bg-rose-50">
            <div className="w-3 h-3 bg-rose-300"></div>
            <span className="font-medium">อยู่โรงย้อม</span>
            <span className="text-stone-500 font-mono text-[10px] uppercase tracking-widest">At dye-house</span>
          </div>
        </div>

        {/* Live data tables */}
        <div className="space-y-8">
          {groups.map(group => {
            const readyFabTotal = group.rows.reduce((a, r) => a + (r.readyRolls || 0), 0);
            const readyRibTotal = group.rows.reduce((a, r) => a + (r.readyRib || 0), 0);
            const dyeFabTotal = group.rows.reduce((a, r) => a + (r.dyeRolls || 0), 0);
            const dyeRibTotal = group.rows.reduce((a, r) => a + (r.dyeRib || 0), 0);

            if (group.rows.length === 0) return null;

            return (
              <div key={group.id} className="border-2 border-stone-900 bg-white overflow-hidden">
                {/* Title bar */}
                <div className="bg-stone-900 text-stone-50 px-4 py-2.5 flex items-baseline justify-between">
                  <div>
                    <span className="font-display text-base font-bold">วัยรุ่นสกรีน · {group.title}</span>
                    <span className="ml-2 text-xs font-mono text-stone-400">{group.subtitle}</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400">
                    {group.rows.length} รายการ
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-stone-900">
                        <th rowSpan={2} className="text-left py-2 px-3 text-[11px] uppercase tracking-widest font-mono text-stone-600 bg-stone-100 border-r border-stone-200 align-middle">
                          สี · Shade
                        </th>
                        <th rowSpan={2} className="text-left py-2 px-3 text-[11px] uppercase tracking-widest font-mono text-stone-600 bg-stone-100 border-r-2 border-stone-900 align-middle">
                          รหัสสี · Code
                        </th>
                        <th colSpan={2} className="text-center py-1.5 px-3 text-xs font-semibold bg-stone-900 text-stone-50 border-r-2 border-stone-900">
                          พร้อมส่ง <span className="font-mono text-[10px] text-stone-400 ml-1">· Ready</span>
                        </th>
                        <th colSpan={2} className="text-center py-1.5 px-3 text-xs font-semibold bg-rose-300 text-stone-900 border-r-2 border-stone-900">
                          อยู่โรงย้อม <span className="font-mono text-[10px] opacity-70 ml-1">· At dye-house</span>
                        </th>
                        <th rowSpan={2} className="text-left py-2 px-3 text-[11px] uppercase tracking-widest font-mono text-stone-600 bg-stone-100 align-middle">
                          ราคา/กก. · Price/kg
                        </th>
                        {role === "customer" && (
                          <th rowSpan={2} className="text-right py-2 px-3 text-[11px] uppercase tracking-widest font-mono text-stone-600 bg-stone-100 align-middle">
                            เพิ่ม · Add
                          </th>
                        )}
                      </tr>
                      <tr className="border-b-2 border-stone-900">
                        <th className="text-right py-2 px-3 text-[11px] uppercase tracking-widest font-mono text-stone-50 bg-stone-700">
                          {group.width} <span className="opacity-60">พับ</span>
                        </th>
                        <th className="text-right py-2 px-3 text-[11px] uppercase tracking-widest font-mono text-stone-50 bg-stone-700 border-r-2 border-stone-900">
                          Rib
                        </th>
                        <th className="text-right py-2 px-3 text-[11px] uppercase tracking-widest font-mono text-stone-900 bg-rose-200">
                          {group.width} <span className="opacity-60">พับ</span>
                        </th>
                        <th className="text-right py-2 px-3 text-[11px] uppercase tracking-widest font-mono text-stone-900 bg-rose-200 border-r-2 border-stone-900">
                          Rib
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.map((row, i) => {
                        const cartKey = `${group.id}__${row.shade}__${row.price_per_kg}`;
                        const inCart = cart[cartKey] || 0;
                        const hasStock = (row.readyRolls || 0) > 0;

                        return (
                          <tr
                            key={i}
                            className={`border-t border-stone-200 hover:bg-stone-50 transition ${
                              (row.readyRolls || 0) === 0 && (row.dyeRolls || 0) === 0 ? "bg-stone-50/60" : ""
                            }`}
                          >
                            {/* Shade column */}
                            <td className="py-2.5 px-3 border-r border-stone-200">
                              <div className="font-medium text-stone-900">{row.shade}</div>
                              <div className="text-[10px] text-stone-500 font-mono">ratio: {row.ratio || 'ok'}</div>
                            </td>
                            {/* Code column */}
                            <td className="py-2.5 px-3 font-mono text-xs text-stone-600 border-r-2 border-stone-900">
                              {row.code}
                            </td>
                            {/* Ready: fabric */}
                            <td className="py-2.5 px-3 text-right font-mono tabular">
                              {(row.readyRolls || 0) > 0 ? (
                                <span className="text-base font-semibold">{row.readyRolls}</span>
                              ) : (
                                <span className="text-stone-300">—</span>
                              )}
                            </td>
                            {/* Ready: rib */}
                            <td className="py-2.5 px-3 text-right font-mono tabular border-r-2 border-stone-900">
                              {(row.readyRib || 0) > 0 ? (
                                <span className="text-stone-700">{row.readyRib}</span>
                              ) : (
                                <span className="text-stone-300">—</span>
                              )}
                            </td>
                            {/* Dyehouse: fabric */}
                            <td className="py-2.5 px-3 text-right font-mono tabular bg-rose-50/50">
                              {(row.dyeRolls || 0) > 0 ? (
                                <span className="text-rose-700 font-semibold">{row.dyeRolls}</span>
                              ) : (
                                <span className="text-stone-300">—</span>
                              )}
                            </td>
                            {/* Dyehouse: rib */}
                            <td className="py-2.5 px-3 text-right font-mono tabular bg-rose-50/50 border-r-2 border-stone-900">
                              {(row.dyeRib || 0) > 0 ? (
                                <span className="text-rose-700">{row.dyeRib}</span>
                              ) : (
                                <span className="text-stone-300">—</span>
                              )}
                            </td>
                            {/* Price column */}
                            <td className="py-2.5 px-3 font-mono text-xs text-stone-600">
                              ฿{row.price_per_kg || 0}/kg
                            </td>
                            {/* Add to cart column */}
                            {role === "customer" && (
                              <td className="py-2.5 px-3 text-right">
                                {hasStock ? (
                                  <div className="flex items-center gap-2 justify-end">
                                    <button
                                      onClick={() => updateCart(cartKey, -1)}
                                      disabled={inCart === 0}
                                      className="w-7 h-7 text-xs font-bold disabled:opacity-30 border border-stone-300 hover:border-stone-900 transition"
                                    >
                                      −
                                    </button>
                                    <span className="w-8 text-center font-mono text-xs tabular">
                                      {inCart > 0 ? inCart : ''}
                                    </span>
                                    <button
                                      onClick={() => updateCart(cartKey, 1)}
                                      disabled={inCart >= (row.readyRolls || 0)}
                                      className="w-7 h-7 text-xs font-bold disabled:opacity-30 border border-stone-300 hover:border-stone-900 transition"
                                    >
                                      +
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-stone-400 font-mono uppercase tracking-widest">หมด</span>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                      
                      {/* Totals row */}
                      <tr className="border-t-2 border-stone-900 bg-stone-100 font-mono text-xs">
                        <td className="py-2.5 px-3 font-semibold border-r border-stone-200">รวม · Total</td>
                        <td className="py-2.5 px-3 border-r-2 border-stone-900"></td>
                        <td className="py-2.5 px-3 text-right font-bold text-base">{readyFabTotal}</td>
                        <td className="py-2.5 px-3 text-right font-bold border-r-2 border-stone-900">{readyRibTotal}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-rose-700 bg-rose-50">{dyeFabTotal}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-rose-700 bg-rose-50 border-r-2 border-stone-900">{dyeRibTotal}</td>
                        <td className="py-2.5 px-3"></td>
                        {role === "customer" && <td className="py-2.5 px-3"></td>}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// OTHER VIEWS & HELPERS
// ─────────────────────────────────────────────────────────────

function OrdersView({ role }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-6 pb-3 border-b-2 border-stone-900">
        <div>
          <h2 className="font-display text-xl font-bold">คำสั่งซื้อล่าสุด · Recent Orders</h2>
          <p className="text-xs font-mono text-stone-500 uppercase tracking-widest">
            Mock data · Order-items wiring next session
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {OPEN_ORDERS.map(order => (
          <div key={order.id} className="border-2 border-stone-900 bg-white">
            <div className="bg-stone-900 text-stone-50 px-4 py-2.5 flex items-baseline justify-between">
              <div className="flex items-baseline gap-4">
                <span className="font-mono text-sm font-bold">{order.id}</span>
                <span className="text-xs text-stone-400">{order.date}</span>
                <span className="text-sm">{order.customer}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 ${
                  order.status === "shipped" ? "bg-emerald-500" :
                  order.status === "partial" ? "bg-amber-500" : "bg-stone-400"
                }`}></div>
                <span className="text-xs font-mono uppercase tracking-widest">
                  {order.status === "shipped" ? "ส่งแล้ว" : 
                   order.status === "partial" ? "บางส่วน" : "รอ"}
                </span>
              </div>
            </div>

            <div className="p-4">
              <div className="grid gap-2">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-stone-200 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 ${
                        item.status === "shipped" || item.status === "ready" ? "bg-emerald-600" :
                        item.status === "partial" ? "bg-amber-500" :
                        item.status === "waiting" ? "bg-red-700" : "bg-stone-400"
                      }`}></div>
                      <span className="font-medium">{item.shade}</span>
                      {item.note && <span className="text-xs text-stone-500">({item.note})</span>}
                    </div>
                    <div className="font-mono text-sm tabular">
                      {item.status === "partial" ? `${item.fulfilled}/${item.rolls}` : item.rolls} พับ
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminView() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null); // row being edited
  const [saveToast, setSaveToast] = useState(null); // "success" | "error" | null

  const fetchRows = async () => {
    try {
      setLoading(true);
      setError(null);
      const { supabase } = await import('../lib/supabase');
      const { data, error: err } = await supabase
        .from('stock')
        .select('*')
        .order('group_id', { ascending: true })
        .order('item_type', { ascending: true })
        .order('shade', { ascending: true });
      if (err) throw err;
      setRows(data || []);
    } catch (err) {
      console.error('Error fetching stock:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRows(); }, []);

  const handleSave = async (updated) => {
    try {
      const { supabase } = await import('../lib/supabase');
      const { error: err } = await supabase
        .from('stock')
        .update({
          ready_rolls: updated.ready_rolls,
          ready_kg: updated.ready_kg,
          dye_rolls: updated.dye_rolls,
          dye_kg: updated.dye_kg,
          eta_date: updated.eta_date || null,
          note: updated.note || null,
          ratio: updated.ratio,
          updated_at: new Date().toISOString(),
        })
        .eq('id', updated.id);
      if (err) throw err;
      setSaveToast('success');
      setEditing(null);
      await fetchRows();
      setTimeout(() => setSaveToast(null), 3000);
    } catch (err) {
      console.error('Save failed:', err);
      setSaveToast(`error: ${err.message}`);
      setTimeout(() => setSaveToast(null), 5000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader size={24} className="animate-spin text-stone-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-2 border-red-700 bg-red-50 p-8 text-center">
        <AlertTriangle size={32} className="mx-auto mb-4 text-red-700" />
        <div className="text-red-900 font-semibold mb-2">โหลดไม่สำเร็จ</div>
        <div className="text-red-700 text-sm mb-4">{error}</div>
        <button onClick={fetchRows} className="px-4 py-2 bg-red-700 text-white text-sm">ลองใหม่</button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-baseline justify-between mb-6 pb-3 border-b-2 border-stone-900">
        <div>
          <h2 className="font-display text-xl font-bold">กรอกข้อมูลสต๊อก · Stock Data Entry</h2>
          <p className="text-xs font-mono text-stone-500 uppercase tracking-widest">
            Click a row to edit · {rows.length} items
          </p>
        </div>
        <button
          onClick={fetchRows}
          className="text-xs font-mono uppercase tracking-widest text-stone-500 hover:text-stone-900 border border-stone-300 hover:border-stone-900 px-3 py-1 transition"
        >
          รีเฟรช · Refresh
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-16 text-stone-500">
          <Package size={32} className="mx-auto mb-4 text-stone-300" />
          <div>ไม่มีข้อมูลสต๊อก · No stock rows yet</div>
          <div className="text-xs font-mono text-stone-400 mt-1">Add rows via SQL or v1.1 form (not built)</div>
        </div>
      ) : (
        <div className="border-2 border-stone-900 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-stone-900 bg-stone-100">
                <th className="text-left py-2 px-3 text-[11px] uppercase tracking-widest font-mono text-stone-600">Group</th>
                <th className="text-left py-2 px-3 text-[11px] uppercase tracking-widest font-mono text-stone-600">Type</th>
                <th className="text-left py-2 px-3 text-[11px] uppercase tracking-widest font-mono text-stone-600">SKU</th>
                <th className="text-left py-2 px-3 text-[11px] uppercase tracking-widest font-mono text-stone-600">Shade</th>
                <th className="text-right py-2 px-3 text-[11px] uppercase tracking-widest font-mono text-stone-600">พร้อมส่ง (พับ/kg)</th>
                <th className="text-right py-2 px-3 text-[11px] uppercase tracking-widest font-mono text-stone-600">โรงย้อม (พับ/kg)</th>
                <th className="text-left py-2 px-3 text-[11px] uppercase tracking-widest font-mono text-stone-600">ETA</th>
                <th className="text-left py-2 px-3 text-[11px] uppercase tracking-widest font-mono text-stone-600">Ratio</th>
                <th className="text-left py-2 px-3 text-[11px] uppercase tracking-widest font-mono text-stone-600">Note</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr
                  key={r.id}
                  onClick={() => setEditing(r)}
                  className="border-t border-stone-200 hover:bg-amber-50 cursor-pointer transition"
                >
                  <td className="py-2 px-3 font-mono text-xs">{r.group_id}</td>
                  <td className="py-2 px-3 text-xs">{r.item_type}</td>
                  <td className="py-2 px-3 font-mono text-xs">{r.sku}</td>
                  <td className="py-2 px-3">{r.shade}</td>
                  <td className="py-2 px-3 text-right font-mono tabular">{r.ready_rolls || 0} / {r.ready_kg || 0}</td>
                  <td className="py-2 px-3 text-right font-mono tabular text-rose-700">{r.dye_rolls || 0} / {r.dye_kg || 0}</td>
                  <td className="py-2 px-3 font-mono text-xs">{r.eta_date || '—'}</td>
                  <td className="py-2 px-3 text-xs">
                    <span className={`font-mono px-1.5 py-0.5 ${
                      r.ratio === 'ok' ? 'bg-emerald-100 text-emerald-800' :
                      r.ratio === 'short' ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }`}>{r.ratio}</span>
                  </td>
                  <td className="py-2 px-3 text-xs text-stone-500 max-w-[200px] truncate">{r.note || '—'}</td>
                  <td className="py-2 px-3"><Edit3 size={14} className="text-stone-400" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <StockEditModal
          row={editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}

      {saveToast && (
        <div className={`fixed bottom-8 right-8 z-50 px-6 py-4 border-2 animate-slide-up ${
          saveToast === 'success'
            ? 'bg-emerald-700 text-white border-emerald-900'
            : 'bg-red-700 text-white border-red-900'
        }`}>
          <div className="flex items-center gap-3">
            {saveToast === 'success' ? <Check size={20} /> : <AlertTriangle size={20} />}
            <div className="font-semibold">
              {saveToast === 'success' ? 'บันทึกแล้ว · Saved' : saveToast}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StockEditModal({ row, onSave, onClose }) {
  const [form, setForm] = useState({
    id: row.id,
    ready_rolls: row.ready_rolls || 0,
    ready_kg: row.ready_kg || 0,
    dye_rolls: row.dye_rolls || 0,
    dye_kg: row.dye_kg || 0,
    eta_date: row.eta_date || '',
    note: row.note || '',
    ratio: row.ratio || 'ok',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white border-4 border-stone-900 max-w-lg w-full max-h-[90vh] overflow-auto animate-slide-up">
        <div className="bg-stone-900 text-stone-50 p-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-bold">แก้ไขสต๊อก · Edit Stock</h3>
            <div className="text-xs font-mono text-stone-400 mt-1">{row.sku} · {row.shade}</div>
          </div>
          <button onClick={onClose} disabled={saving} className="text-stone-400 hover:text-stone-50 disabled:opacity-50">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-stone-600 mb-1">พร้อมส่ง (พับ)</label>
              <input
                type="number"
                min="0"
                value={form.ready_rolls}
                onChange={e => setForm({ ...form, ready_rolls: parseInt(e.target.value) || 0 })}
                className="w-full border-2 border-stone-900 p-2 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-stone-600 mb-1">พร้อมส่ง (kg)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.ready_kg}
                onChange={e => setForm({ ...form, ready_kg: parseFloat(e.target.value) || 0 })}
                className="w-full border-2 border-stone-900 p-2 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-stone-600 mb-1">โรงย้อม (พับ)</label>
              <input
                type="number"
                min="0"
                value={form.dye_rolls}
                onChange={e => setForm({ ...form, dye_rolls: parseInt(e.target.value) || 0 })}
                className="w-full border-2 border-stone-900 p-2 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-stone-600 mb-1">โรงย้อม (kg)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.dye_kg}
                onChange={e => setForm({ ...form, dye_kg: parseFloat(e.target.value) || 0 })}
                className="w-full border-2 border-stone-900 p-2 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-stone-600 mb-1">ETA (วันที่คาดส่งจากโรงย้อม)</label>
            <input
              type="date"
              value={form.eta_date}
              onChange={e => setForm({ ...form, eta_date: e.target.value })}
              className="w-full border-2 border-stone-900 p-2 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-stone-600 mb-1">สถานะ · Ratio</label>
            <select
              value={form.ratio}
              onChange={e => setForm({ ...form, ratio: e.target.value })}
              className="w-full border-2 border-stone-900 p-2 font-mono"
            >
              <option value="ok">ok · ปกติ</option>
              <option value="short">short · ริบขาด</option>
              <option value="out">out · หมด</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-stone-600 mb-1">หมายเหตุ · Note</label>
            <textarea
              value={form.note}
              onChange={e => setForm({ ...form, note: e.target.value })}
              placeholder="เช่น ต้องย้อมเพิ่ม 1 พับ"
              className="w-full border-2 border-stone-900 p-2 h-20 text-sm"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-3 border-2 border-stone-900 font-semibold hover:bg-stone-900 hover:text-stone-50 transition disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 py-3 bg-stone-900 text-stone-50 font-semibold hover:bg-stone-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <><Loader size={16} className="animate-spin" /> กำลังบันทึก</> : <><Check size={16} /> บันทึก</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OCRView() {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-6 pb-3 border-b-2 border-stone-900">
        <div>
          <h2 className="font-display text-xl font-bold">สแกนบิล · OCR Invoice</h2>
          <p className="text-xs font-mono text-stone-500 uppercase tracking-widest">
            Provider only · OCR integration parked
          </p>
        </div>
      </div>
      
      <div className="border-2 border-stone-900 bg-stone-50 p-8 text-center">
        <Camera size={32} className="mx-auto mb-4 text-stone-600" />
        <div className="text-stone-900 font-semibold mb-2">OCR view - parked until production integration</div>
        <div className="text-stone-700 text-sm">Invoice scanning will be added in Phase 2</div>
      </div>
    </div>
  );
}

function KPI({ labelTh, labelEn, value, unit, bordered = false, alert = false }) {
  return (
    <div className={`p-4 ${bordered ? "border-l-2 border-stone-900" : ""} ${alert ? "bg-red-50" : ""}`}>
      <div className="text-[10px] uppercase tracking-widest font-mono text-stone-500 mb-1">{labelTh} · {labelEn}</div>
      <div className={`text-xl font-bold tabular font-mono ${alert ? "text-red-700" : "text-stone-900"}`}>
        {value} <span className="text-sm text-stone-500 font-normal">{unit}</span>
      </div>
    </div>
  );
}

function SendOrderModal({ cart, setCart, onClose, onSent }) {
  const [destination, setDestination] = useState("");
  const [note, setNote] = useState("");
  
  const cartItems = Object.keys(cart).filter(k => cart[k] > 0);
  const totalRolls = Object.values(cart).reduce((a, b) => a + (b || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white border-4 border-stone-900 max-w-2xl w-full max-h-[90vh] overflow-auto animate-slide-up">
        <div className="bg-stone-900 text-stone-50 p-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">ตรวจสอบคำสั่งซื้อ · Review Order</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-50"><X size={20} /></button>
        </div>
        
        <div className="p-6">
          <div className="space-y-4 mb-6">
            {cartItems.map(key => {
              const [groupId, shade, price] = key.split('__');
              const qty = cart[key];
              return (
                <div key={key} className="flex items-center justify-between py-2 border-b border-stone-200">
                  <div>
                    <span className="font-medium">{shade}</span>
                    <span className="ml-2 text-xs text-stone-500 font-mono">{groupId.toUpperCase()}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold">{qty} พับ</div>
                    <div className="text-xs text-stone-500">฿{price}/kg</div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">จุดหมาย · Destination</label>
            <select 
              value={destination}
              onChange={e => setDestination(e.target.value)}
              className="w-full border-2 border-stone-900 p-2 text-sm"
            >
              <option value="">เลือกจุดหมาย</option>
              <option value="คลอง 4">คลอง 4</option>
              <option value="โรงงาน">โรงงาน</option>
              <option value="อื่นๆ">อื่นๆ</option>
            </select>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">หมายเหตุ · Note (ถ้ามี)</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="เช่น ขอส่งก่อน 15.00 น."
              className="w-full border-2 border-stone-900 p-3 text-sm h-20"
            />
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-3 border-2 border-stone-900 text-stone-900 font-semibold hover:bg-stone-900 hover:text-stone-50 transition"
            >
              แก้ไข
            </button>
            <button 
              onClick={onSent}
              disabled={!destination}
              className="flex-1 py-3 bg-stone-900 text-stone-50 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-700 transition flex items-center justify-center gap-2"
            >
              ส่งคำสั่งซื้อ
              <Send size={16} />
            </button>
          </div>
          
          <div className="mt-4 text-center text-xs text-stone-500 font-mono">
            รวม {totalRolls} พับ · {cartItems.length} รายการ
          </div>
        </div>
      </div>
    </div>
  );
}
