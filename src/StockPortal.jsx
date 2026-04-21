import { useState, useMemo, useEffect } from "react";
import {
  Search, Package, Clock, AlertTriangle, Plus, ChevronRight, Eye, Edit3,
  Check, X, TrendingDown, Truck, FileText, Upload, Camera, Loader,
  ArrowLeft, MapPin, Zap, Send, Scan
} from "lucide-react";
import { useStock } from "./hooks/useStock";
import { supabase } from "./lib/supabase";
import { useCartSubmit, makeCartKey, parseCartKey } from "./hooks/useCart";
import { useSalesOrders } from "./hooks/useSalesOrders";

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

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
                <span className="text-xs font-mono text-stone-500 uppercase tracking-widest">พอร์ทัลสต๊อกผ้า · v0.4.1</span>
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
              { id: "orders", labelTh: "คำสั่งซื้อ", labelEn: "Customer Orders", icon: FileText },
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
          <span className="uppercase tracking-widest">Live Data · Supabase v0.4.1</span>
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
          onSent={(orderRef) => {
            setOrderSent(orderRef);
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
              <div className="text-xs text-emerald-100 font-mono">{orderSent}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── END OF PART 1 — paste PART 2 next ───

// ─────────────────────────────────────────────────────────────
// STOCK VIEW — LIVE SUPABASE DATA
// ─────────────────────────────────────────────────────────────

function StockView({ role, search, setSearch, groups, loading, error, refresh, cart, setCart }) {
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

        <div className="space-y-8">
          {groups.map(group => {
            const readyFabTotal = group.rows.reduce((a, r) => a + (r.readyRolls || 0), 0);
            const readyRibTotal = group.rows.reduce((a, r) => a + (r.readyRib || 0), 0);
            const dyeFabTotal = group.rows.reduce((a, r) => a + (r.dyeRolls || 0), 0);
            const dyeRibTotal = group.rows.reduce((a, r) => a + (r.dyeRib || 0), 0);

            if (group.rows.length === 0) return null;

            return (
              <div key={group.id} className="border-2 border-stone-900 bg-white overflow-hidden">
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
                        <th rowSpan={2} className="text-right py-2 px-3 text-[11px] uppercase tracking-widest font-mono text-red-700 bg-stone-100 border-r border-stone-200 align-middle">
                          ฿/kg
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
                        const cartKey = makeCartKey(row.sku, row.shade, row.price_per_kg);
                        const inCart = cart[cartKey] || 0;
                        const hasStock = (row.readyRolls || 0) > 0;

                        return (
                          <tr
                            key={i}
                            className={`border-t border-stone-200 hover:bg-stone-50 transition ${
                              (row.readyRolls || 0) === 0 && (row.dyeRolls || 0) === 0 ? "bg-stone-50/60" : ""
                            }`}
                          >
                            <td className="py-2.5 px-3 border-r border-stone-200">
                              <div className="font-medium text-stone-900">{row.shade}</div>
                              <div className="text-[10px] text-stone-500 font-mono">ratio: {row.ratio || 'ok'}</div>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular border-r border-stone-200">
                              {row.price_per_kg ? (
                                <span className="text-base font-bold text-red-700">฿{row.price_per_kg}</span>
                              ) : (
                                <span className="text-stone-300">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-xs text-stone-600 border-r-2 border-stone-900">
                              {row.code}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular">
                              {(row.readyRolls || 0) > 0 ? (
                                <span className="text-base font-semibold">{row.readyRolls}</span>
                              ) : (
                                <span className="text-stone-300">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular border-r-2 border-stone-900">
                              {(row.readyRib || 0) > 0 ? (
                                <span className="text-stone-700">{row.readyRib}</span>
                              ) : (
                                <span className="text-stone-300">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular bg-rose-50/50">
                              {(row.dyeRolls || 0) > 0 ? (
                                <span className="text-rose-700 font-semibold">{row.dyeRolls}</span>
                              ) : (
                                <span className="text-stone-300">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular bg-rose-50/50 border-r-2 border-stone-900">
                              {(row.dyeRib || 0) > 0 ? (
                                <span className="text-rose-700">{row.dyeRib}</span>
                              ) : (
                                <span className="text-stone-300">—</span>
                              )}
                            </td>

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

                      <tr className="border-t-2 border-stone-900 bg-stone-100 font-mono text-xs">
                        <td className="py-2.5 px-3 font-semibold border-r border-stone-200">รวม · Total</td>
                        <td className="py-2.5 px-3 border-r-2 border-stone-900"></td>
                        <td className="py-2.5 px-3 border-r border-stone-200"></td>

                        <td className="py-2.5 px-3 text-right font-bold text-base">{readyFabTotal}</td>
                        <td className="py-2.5 px-3 text-right font-bold border-r-2 border-stone-900">{readyRibTotal}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-rose-700 bg-rose-50">{dyeFabTotal}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-rose-700 bg-rose-50 border-r-2 border-stone-900">{dyeRibTotal}</td>

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

// ─── END OF PART 2 — paste PART 3 next ───
