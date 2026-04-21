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
