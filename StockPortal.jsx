import { useState, useMemo } from "react";
import {
  Search, Package, Clock, AlertTriangle, Plus, ChevronRight, Eye, Edit3,
  Check, X, TrendingDown, Truck, FileText, Upload, Camera, Loader,
  ArrowLeft, MapPin, Zap, Send, Scan
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// MOCK DATA — mirrors Gift's actual stock sheet structure
// Three groups: 30CM เส้นคู่ (37"), 20CM (36"), Other (วอร์ม/เกล็ดปลา/DryTech)
// Each row has: shade, code, ready-stock (พับ+rib), dyehouse-stock (พับ+rib), date, note
// ─────────────────────────────────────────────────────────────

const SNAPSHOT_DATE = "17/04/2569";

const STOCK_GROUPS = [
  {
    id: "30cm",
    title: "30CM / เส้นคู่",
    subtitle: '(พร้อมส่ง · width 37")',
    width: '37"',
    rows: [
      { shade: "ดำพิเศษ", gsm: "185", code: "34288-DN",   readyRolls: 20, readyRib: 1, dyeRolls: 0,  dyeRib: 0, dateIn: "02/02/2569", note: "ต้องย้อมบุ๊งเพิ่มอีก 1 พับ" },
      { shade: "ดำซัลเฟอร์", gsm: "175", code: "001-D",     readyRolls: 20, readyRib: 1, dyeRolls: 0,  dyeRib: 0, dateIn: "01/04/2569", note: null },
      { shade: "ขาว",       gsm: "165", code: "002W",      readyRolls: 18, readyRib: 1, dyeRolls: 0,  dyeRib: 0, dateIn: "15/01/2569", note: null },
      { shade: "ดำพิเศษ Bio", gsm: "230", code: "34288-DN", readyRolls: 0,  readyRib: 1, dyeRolls: 0,  dyeRib: 0, dateIn: null,         note: null },
      { shade: "ขาว Bio",   gsm: "210", code: "002W",      readyRolls: 4,  readyRib: 1, dyeRolls: 0,  dyeRib: 0, dateIn: "26/03/2569", note: null },
      { shade: "เทา",       gsm: "180", code: "88054-MN",  readyRolls: 1,  readyRib: 0, dyeRolls: 0,  dyeRib: 0, dateIn: null,         note: null },
    ],
  },
  {
    id: "20cm",
    title: "20CM",
    subtitle: '(พร้อมส่ง · width 36")',
    width: '36"',
    rows: [
      { shade: "ดำพิเศษ",      gsm: "185", code: "34288-DN",  readyRolls: 0,  readyRib: 0, dyeRolls: 0,  dyeRib: 0, dateIn: null,         note: null },
      { shade: "ดำซัลเฟอร์",   gsm: "175", code: "ซัลเฟอร์",   readyRolls: 4,  readyRib: 1, dyeRolls: 40, dyeRib: 2, dateIn: "08/04/2569", note: null },
      { shade: "ขาว",          gsm: "160", code: "002W",      readyRolls: 0,  readyRib: 1, dyeRolls: 45, dyeRib: 2, dateIn: null,         note: null },
      { shade: "แดง",          gsm: "185", code: "87604-DN",  readyRolls: 0,  readyRib: 1, dyeRolls: 0,  dyeRib: 0, dateIn: null,         note: null },
      { shade: "น้ำเงิน",      gsm: "185", code: "87605-DN",  readyRolls: 0,  readyRib: 0, dyeRolls: 10, dyeRib: 1, dateIn: null,         note: null },
      { shade: "เทา",          gsm: "180", code: "87606-L",   readyRolls: 0,  readyRib: 0, dyeRolls: 0,  dyeRib: 0, dateIn: null,         note: null },
      { shade: "เทา #78",      gsm: "185", code: "88084-DN",  readyRolls: 15, readyRib: 1, dyeRolls: 0,  dyeRib: 0, dateIn: "13/03/2569", note: null },
      { shade: "โอวัลติน",     gsm: "180", code: "88052-LN",  readyRolls: 24, readyRib: 1, dyeRolls: 0,  dyeRib: 0, dateIn: "04/02/2569", note: null },
    ],
  },
  {
    id: "other",
    title: "ผ้าอื่นๆ",
    subtitle: "(วอร์ม / เกล็ดปลา / Dry Tech)",
    width: '36"',
    rows: [
      { shade: "AE วอร์ม 2 หน้า",    gsm: "210", code: "ดำ",         readyRolls: 0, readyRib: 0, dyeRolls: 0, dyeRib: 0, dateIn: null, note: "ย้อม HB" },
      { shade: "AE วอร์ม 2 หน้า",    gsm: "190", code: "ขาว",        readyRolls: 0, readyRib: 0, dyeRolls: 0, dyeRib: 0, dateIn: null, note: "ย้อม HB" },
      { shade: "เกล็ดปลา (ขูดขน)",  gsm: "255", code: "ดำ 34288D",   readyRolls: 0, readyRib: 0, dyeRolls: 0, dyeRib: 0, dateIn: null, note: null },
      { shade: "เกล็ดปลา (ขูดขน)",  gsm: "230", code: "ขาว 002W",    readyRolls: 0, readyRib: 0, dyeRolls: 0, dyeRib: 0, dateIn: null, note: null },
      { shade: "Dry Tech (Tc+poly)", gsm: "185", code: "ดำ",         readyRolls: 0, readyRib: 0, dyeRolls: 0, dyeRib: 0, dateIn: null, note: null },
      { shade: "Dry Tech (Tc+poly)", gsm: "160", code: "ขาว",        readyRolls: 0, readyRib: 0, dyeRolls: 0, dyeRib: 0, dateIn: null, note: null },
    ],
  },
];

// Legacy flat array for compatibility with detailed view + cart logic
const STOCK_DATA = STOCK_GROUPS.flatMap(g =>
  g.rows.map(r => ({
    sku: `${g.id.toUpperCase()}-${r.code.replace(/\s+/g, '')}`,
    groupId: g.id,
    groupTitle: g.title,
    type: g.title,
    typeTh: g.title,
    yarn: g.title,
    yarnTh: g.title,
    shade: `${r.shade} ${r.gsm}-`,
    shadeEn: r.code,
    shadeName: r.shade,
    gsm: r.gsm,
    code: r.code,
    width: g.width,
    rolls: r.readyRolls,
    weight: 0,
    ribSku: r.readyRib > 0 ? "Rib" : null,
    ribWeight: r.readyRib,
    ribRolls: r.readyRib,
    lotNo: "—",
    batchNo: "—",
    ratio: r.readyRolls === 0 ? "out" : (r.readyRib === 0 && r.readyRolls > 0 ? "short" : "ok"),
    incoming: (r.dyeRolls > 0 || r.dyeRib > 0) ? { rolls: r.dyeRolls, rib: r.dyeRib, eta: null } : null,
    dateIn: r.dateIn,
    note: r.note,
  }))
);

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

// ─────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────

export default function KnitspeedPortal() {
  const [role, setRole] = useState("customer");
  const [view, setView] = useState("stock");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState({});
  const [showSendOrder, setShowSendOrder] = useState(false);
  const [orderSent, setOrderSent] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return STOCK_DATA;
    const q = search.toLowerCase();
    return STOCK_DATA.filter(s =>
      s.sku.toLowerCase().includes(q) ||
      s.shade.toLowerCase().includes(q) ||
      s.shadeEn.toLowerCase().includes(q) ||
      s.yarn.toLowerCase().includes(q) ||
      s.yarnTh.toLowerCase().includes(q)
    );
  }, [search]);

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
                <span className="text-xs font-mono text-stone-500 uppercase tracking-widest">พอร์ทัลสต๊อกผ้า · v0.2</span>
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
          <StockView role={role} search={search} setSearch={setSearch} items={filtered} cart={cart} setCart={setCart} />
        )}
        {view === "orders" && <OrdersView role={role} />}
        {view === "admin" && role === "provider" && <AdminView />}
        {view === "ocr" && role === "provider" && <OCRView />}
      </main>

      {/* ─── FOOTER ─── */}
      <footer className={`border-t border-stone-200 py-6 paper-grain ${role === "customer" && cartCount > 0 && view === "stock" ? "mb-20" : "mt-16"}`}>
        <div className="max-w-[1400px] mx-auto px-8 flex items-center justify-between text-xs font-mono text-stone-500">
          <span>KNITSPEED CO. · GSC TEXTILES · {role === "customer" ? "โหมดอ่านอย่างเดียว" : "โหมดกรอกข้อมูล"}</span>
          <span className="uppercase tracking-widest">17/04/2569 BE · sync 3 min ago</span>
        </div>
      </footer>

      {/* ─── STICKY CART ─── */}
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

      {/* ─── SEND ORDER MODAL ─── */}
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

      {/* ─── SUCCESS TOAST ─── */}
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
// STOCK VIEW — NOW WITH OVERVIEW TABLE + DETAIL SECTIONS
// ─────────────────────────────────────────────────────────────

function StockView({ role, search, setSearch, items, cart, setCart }) {
  const updateCart = (key, delta) => {
    setCart(c => {
      const next = { ...c };
      const val = Math.max(0, (next[key] || 0) + delta);
      if (val === 0) delete next[key];
      else next[key] = val;
      return next;
    });
  };

  const readyTotal = STOCK_GROUPS.reduce((sum, g) => sum + g.rows.reduce((a, r) => a + r.readyRolls, 0), 0);
  const dyeTotal = STOCK_GROUPS.reduce((sum, g) => sum + g.rows.reduce((a, r) => a + r.dyeRolls, 0), 0);
  const shortCount = STOCK_GROUPS.reduce((sum, g) => sum + g.rows.filter(r => r.readyRolls > 0 && r.readyRib === 0).length, 0);
  const incomingCount = STOCK_GROUPS.reduce((sum, g) => sum + g.rows.filter(r => r.dyeRolls > 0 || r.dyeRib > 0).length, 0);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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

      {/* ─── OVERVIEW: GIFT'S STOCK SHEET LAYOUT ─── */}
      <section className="mb-12">
        <div className="flex items-baseline justify-between mb-3 pb-2 border-b-2 border-stone-900">
          <div>
            <h2 className="font-display text-xl font-bold">ภาพรวมสต๊อก · ตามแบบฟอร์มที่ใช้จริง</h2>
            <p className="text-xs font-mono text-stone-500 uppercase tracking-widest">Stock Overview · Mirrors Gift's working spreadsheet</p>
          </div>
          <span className="font-mono text-xs uppercase tracking-widest text-stone-500">
            Snapshot · {SNAPSHOT_DATE}
          </span>
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

        {/* Three grouped tables mirroring the xlsx exactly */}
        <div className="space-y-8">
          {STOCK_GROUPS.map(group => {
            // Apply search filter
            const visibleRows = search.trim()
              ? group.rows.filter(r => {
                  const q = search.toLowerCase();
                  return r.shade.toLowerCase().includes(q) ||
                         r.code.toLowerCase().includes(q) ||
                         r.gsm.toLowerCase().includes(q) ||
                         group.title.toLowerCase().includes(q);
                })
              : group.rows;
            if (visibleRows.length === 0) return null;

            const readyFabTotal = visibleRows.reduce((a, r) => a + r.readyRolls, 0);
            const readyRibTotal = visibleRows.reduce((a, r) => a + r.readyRib, 0);
            const dyeFabTotal = visibleRows.reduce((a, r) => a + r.dyeRolls, 0);
            const dyeRibTotal = visibleRows.reduce((a, r) => a + r.dyeRib, 0);
            const grandTotal = readyFabTotal + readyRibTotal + dyeFabTotal + dyeRibTotal;

            return (
              <div key={group.id} className="border-2 border-stone-900 bg-white overflow-hidden">
                {/* Title bar */}
                <div className="bg-stone-900 text-stone-50 px-4 py-2.5 flex items-baseline justify-between">
                  <div>
                    <span className="font-display text-base font-bold">วัยรุ่นสกรีน · {group.title}</span>
                    <span className="ml-2 text-xs font-mono text-stone-400">{group.subtitle}</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400">
                    {visibleRows.length} รายการ
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    {/* Two-tier header: merged bucket headers, then field subheaders */}
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
                          วันที่ผ้าเข้า · Date in
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
                      {visibleRows.map((row, i) => {
                        const cartKey = `${group.id}__${row.shade}__${row.gsm}`;
                        const inCart = cart[cartKey] || 0;
                        const hasStock = row.readyRolls > 0;
                        const anchorId = `sku-${group.id}-${i}`;

                        return (
                          <tr
                            id={anchorId}
                            key={i}
                            className={`border-t border-stone-200 hover:bg-stone-50 transition scroll-mt-32 ${
                              row.readyRolls === 0 && row.dyeRolls === 0 ? "bg-stone-50/60" : ""
                            }`}
                          >
                            {/* Shade column — includes GSM weight inline */}
                            <td className="py-2.5 px-3 border-r border-stone-200">
                              <div className="font-medium text-stone-900">{row.shade}</div>
                              <div className="text-[10px] text-stone-500 font-mono">{row.gsm} gsm</div>
                            </td>
                            {/* Code column */}
                            <td className="py-2.5 px-3 font-mono text-xs text-stone-600 border-r-2 border-stone-900">
                              {row.code}
                            </td>
                            {/* Ready: fabric */}
                            <td className="py-2.5 px-3 text-right font-mono tabular">
                              {row.readyRolls > 0 ? (
                                <span className="text-base font-semibold">{row.readyRolls}</span>
                              ) : (
                                <span className="text-stone-300">—</span>
                              )}
                            </td>
                            {/* Ready: rib */}
                            <td className="py-2.5 px-3 text-right font-mono tabular border-r-2 border-stone-900">
                              {row.readyRib > 0 ? (
                                <span className="text-stone-700">{row.readyRib}</span>
                              ) : (
                                <span className="text-stone-300">—</span>
                              )}
                            </td>
                            {/* Dyehouse: fabric */}
                            <td className="py-2.5 px-3 text-right font-mono tabular bg-rose-50/50">
                              {row.dyeRolls > 0 ? (
                                <span className="text-rose-700 font-semibold">{row.dyeRolls}</span>
                              ) : (
                                <span className="text-stone-300">—</span>
                              )}
                            </td>
                            {/* Dyehouse: rib */}
                            <td className="py-2.5 px-3 text-right font-mono tabular bg-rose-50/50 border-r-2 border-stone-900">
                              {row.dyeRib > 0 ? (
                                <span className="text-rose-700">{row.dyeRib}</span>
                              ) : (
                                <span className="text-stone-300">—</span>
                              )}
                            </td>
                            {/* Date in */}
                            <td className="py-2.5 px-3 font-mono text-[11px] text-stone-600">
                              {row.dateIn ? (
                                <span>{row.dateIn}</span>
                              ) : (
                                <span className="text-stone-300">—</span>
                              )}
                              {row.note && (
                                <div className="text-[10px] text-red-600 mt-0.5 font-sans not-italic">
                                  <AlertTriangle size={10} className="inline mr-0.5 -mt-0.5" strokeWidth={2} />
                                  {row.note}
                                </div>
                              )}
                            </td>
                            {/* Add to cart */}
                            {role === "customer" && (
                              <td className="py-2.5 px-3 text-right">
                                <div className="inline-flex items-center border border-stone-300">
                                  <button
                                    onClick={() => updateCart(cartKey, -1)}
                                    disabled={inCart === 0}
                                    className="px-1.5 py-0.5 text-stone-600 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed text-sm"
                                  >
                                    −
                                  </button>
                                  <span className="px-2 font-mono tabular text-xs min-w-[1.75rem] text-center">
                                    {inCart}
                                  </span>
                                  <button
                                    onClick={() => updateCart(cartKey, 1)}
                                    disabled={!hasStock}
                                    className="px-1.5 py-0.5 text-stone-600 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed text-sm"
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                      {/* Total row — mirrors Gift's รวม row with green-filled grand total */}
                      <tr className="border-t-2 border-stone-900 bg-stone-100 font-semibold">
                        <td className="py-2.5 px-3"></td>
                        <td className="py-2.5 px-3 text-right text-xs uppercase tracking-widest font-mono text-stone-600 border-r-2 border-stone-900">
                          รวม · Total
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular text-base">
                          {readyFabTotal}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular text-stone-700 border-r-2 border-stone-900">
                          {readyRibTotal}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular text-base text-rose-700 bg-rose-50">
                          {dyeFabTotal}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular text-rose-700 bg-rose-50 border-r-2 border-stone-900">
                          {dyeRibTotal}
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular text-base bg-lime-200 text-stone-900">
                          <span className="text-[10px] uppercase tracking-widest text-stone-600 mr-2">ทั้งหมด</span>
                          <span className="font-bold">{grandTotal}</span>
                        </td>
                        {role === "customer" && <td className="py-2.5 px-3"></td>}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>

        {/* Annotation: explain the format */}
        <div className="mt-6 border-l-4 border-stone-400 bg-stone-50 px-5 py-3 text-xs text-stone-600">
          <div className="font-semibold text-stone-900 mb-1">อ่านตารางนี้อย่างไร <span className="font-mono text-[10px] text-stone-500 font-normal">· How to read this</span></div>
          <div>
            ฝั่งซ้าย (สีดำ) = <span className="font-semibold">พร้อมส่ง</span>ทันที · ฝั่งขวา (สีชมพู) = <span className="font-semibold">อยู่ที่โรงย้อม</span> จะเข้ามาเร็วๆ นี้
            · คอลัมน์ <span className="font-mono">Rib</span> คือริบคอที่แมตช์กับล็อตนั้น (เป็นจำนวนพับ)
            · ตัวเลขในช่องรวมสีเขียว = จำนวนพับทั้งหมด (ทั้งพร้อมส่ง + อยู่โรงย้อม)
          </div>
        </div>
      </section>

      {role === "customer" && (
        <div className="mt-2 border-l-4 border-amber-500 bg-amber-50 px-6 py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-700 mt-0.5 shrink-0" strokeWidth={2} />
            <div className="text-sm">
              <div className="font-semibold text-amber-900 mb-1">เรื่องริบคอ <span className="font-mono text-xs text-amber-700 font-normal">· Rib Coverage</span></div>
              <div className="text-amber-800">
                คอลัมน์ <span className="font-mono text-xs bg-white px-1.5 py-0.5 border border-amber-300">Rib</span> คือริบคอที่ตรงกับล็อตผ้านั้น (จำนวนพับ) ·
                ถ้ามีผ้าแต่ <span className="font-semibold">Rib = —</span> แสดงว่าริบขาดสำหรับล็อตนั้น ·
                Knitspeed กำลังย้อมริบเพิ่ม 7–8% buffer เพื่อแก้ปัญหานี้ครับ
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KPI({ labelTh, labelEn, value, unit, bordered, alert }) {
  return (
    <div className={`${bordered ? "border-l-2 border-stone-900" : ""} ${alert ? "bg-red-50" : ""} p-5`}>
      <div className="text-xs text-stone-700 font-medium">{labelTh}</div>
      <div className="text-[10px] text-stone-400 font-mono uppercase tracking-widest mb-2">{labelEn}</div>
      <div className="flex items-baseline gap-1.5">
        <span className={`font-display text-3xl font-bold tabular ${alert ? "text-red-700" : ""}`}>{value}</span>
        <span className="text-xs text-stone-500 font-mono">{unit}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SEND ORDER MODAL — full-screen review
// ─────────────────────────────────────────────────────────────

function SendOrderModal({ cart, setCart, onClose, onSent }) {
  const [destination, setDestination] = useState("คลอง 4");
  const [urgency, setUrgency] = useState("normal");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const cartLines = useMemo(() => {
    return Object.entries(cart)
      .filter(([, v]) => v > 0)
      .map(([key, qty]) => {
        const [groupId, shadeName, gsm] = key.split("__");
        const group = STOCK_GROUPS.find(g => g.id === groupId);
        const row = group?.rows.find(r => r.shade === shadeName && r.gsm === gsm);
        return {
          key,
          groupTitle: group?.title || groupId,
          shade: shadeName,
          gsm,
          code: row?.code || "",
          width: group?.width || "",
          qty,
          row,
          hasRib: row ? row.readyRib > 0 : false,
        };
      });
  }, [cart]);

  const totalRolls = cartLines.reduce((a, b) => a + b.qty, 0);
  // Rib warning: any line with fabric but zero ready rib
  const warnings = cartLines.filter(line => line.row && line.row.readyRolls > 0 && line.row.readyRib === 0);

  const updateQty = (key, delta) => {
    setCart(c => {
      const next = { ...c };
      const val = Math.max(0, (next[key] || 0) + delta);
      if (val === 0) delete next[key];
      else next[key] = val;
      return next;
    });
  };

  const handleSend = () => {
    setSubmitting(true);
    setTimeout(() => { setSubmitting(false); onSent(); }, 900);
  };

  return (
    <div className="fixed inset-0 bg-stone-900/80 z-40 flex items-stretch justify-center animate-fade-in overflow-y-auto">
      <div className="w-full max-w-3xl bg-stone-50 my-8 border-2 border-stone-900 animate-slide-up">
        {/* Header */}
        <div className="bg-stone-900 text-stone-50 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-stone-400 hover:text-stone-50 transition">
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="font-display text-xl font-bold">ตรวจสอบคำสั่งซื้อ</div>
              <div className="text-xs font-mono text-stone-400 uppercase tracking-widest">Review & Send Order</div>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-50 transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Summary bar */}
          <div className="grid grid-cols-3 border-2 border-stone-900 bg-white">
            <div className="p-4">
              <div className="text-[10px] font-mono uppercase tracking-widest text-stone-500">รวม · Total</div>
              <div className="font-display text-2xl font-bold tabular">{totalRolls} <span className="text-sm text-stone-500 font-mono">พับ</span></div>
            </div>
            <div className="p-4 border-l-2 border-stone-900">
              <div className="text-[10px] font-mono uppercase tracking-widest text-stone-500">รายการ · Lines</div>
              <div className="font-display text-2xl font-bold tabular">{cartLines.length}</div>
            </div>
            <div className="p-4 border-l-2 border-stone-900">
              <div className="text-[10px] font-mono uppercase tracking-widest text-stone-500">กลุ่มผ้า · Groups</div>
              <div className="font-display text-2xl font-bold tabular">{new Set(cartLines.map(l => l.groupTitle)).size}</div>
            </div>
          </div>

          {/* Warning banner */}
          {warnings.length > 0 && (
            <div className="border-l-4 border-amber-500 bg-amber-50 px-5 py-3">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-amber-700 mt-0.5 shrink-0" strokeWidth={2.5} />
                <div className="text-sm text-amber-900">
                  <div className="font-semibold mb-0.5">พบริบขาด {warnings.length} รายการ <span className="font-mono text-xs text-amber-700 font-normal">· {warnings.length} lines with rib shortage</span></div>
                  <div className="text-xs text-amber-800">มีผ้าแต่ริบคอไม่พอ · Gift จะยืนยันจำนวนริบที่แน่นอนอีกครั้งก่อนจัดส่ง</div>
                </div>
              </div>
            </div>
          )}

          {/* Line items */}
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-stone-600 mb-2">รายการสินค้า · Line Items</div>
            <div className="border-2 border-stone-900 bg-white divide-y divide-stone-200">
              {cartLines.map(line => (
                <div key={line.key} className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">
                      {line.shade} {line.gsm}
                      {!line.hasRib && (
                        <span className="ml-2 text-[10px] font-mono uppercase tracking-widest bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5">
                          <AlertTriangle size={9} className="inline -mt-0.5 mr-0.5" strokeWidth={2} /> ริบขาด
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-stone-500 font-mono">{line.groupTitle} · {line.code} · {line.width}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="inline-flex items-center border border-stone-300">
                      <button onClick={() => updateQty(line.key, -1)} className="px-2 py-1 text-stone-600 hover:bg-stone-100">−</button>
                      <span className="px-3 font-mono tabular text-sm min-w-[2.5rem] text-center">{line.qty}</span>
                      <button onClick={() => updateQty(line.key, 1)} className="px-2 py-1 text-stone-600 hover:bg-stone-100">+</button>
                    </div>
                    <span className="text-xs text-stone-500 font-mono w-10">พับ</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Destination */}
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-stone-600 mb-2 flex items-center gap-1.5">
              <MapPin size={12} /> ที่อยู่จัดส่ง · Destination
            </div>
            <div className="grid grid-cols-2 gap-0 border-2 border-stone-900 bg-white">
              {["คลอง 4", "โรงงาน"].map(dest => (
                <button
                  key={dest}
                  onClick={() => setDestination(dest)}
                  className={`p-4 text-left transition ${destination === dest ? "bg-stone-900 text-stone-50" : "hover:bg-stone-50"} ${dest === "โรงงาน" ? "border-l-2 border-stone-900" : ""}`}
                >
                  <div className="font-medium">{dest}</div>
                  <div className={`text-[10px] font-mono uppercase tracking-widest ${destination === dest ? "text-stone-400" : "text-stone-500"}`}>
                    {dest === "คลอง 4" ? "Klong 4 warehouse" : "Main factory"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Urgency */}
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-stone-600 mb-2 flex items-center gap-1.5">
              <Zap size={12} /> ความเร่งด่วน · Urgency
            </div>
            <div className="grid grid-cols-3 gap-0 border-2 border-stone-900 bg-white">
              {[
                { id: "normal", th: "ปกติ", en: "Normal" },
                { id: "urgent", th: "ด่วน", en: "Urgent" },
                { id: "asap", th: "ด่วนมาก", en: "ASAP" },
              ].map((u, i) => (
                <button
                  key={u.id}
                  onClick={() => setUrgency(u.id)}
                  className={`p-3 text-center transition ${urgency === u.id ? (u.id === "asap" ? "bg-red-700 text-white" : u.id === "urgent" ? "bg-amber-500 text-stone-900" : "bg-stone-900 text-stone-50") : "hover:bg-stone-50"} ${i > 0 ? "border-l-2 border-stone-900" : ""}`}
                >
                  <div className="font-medium text-sm">{u.th}</div>
                  <div className={`text-[10px] font-mono uppercase tracking-widest ${urgency === u.id ? "opacity-70" : "text-stone-500"}`}>{u.en}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-stone-600 mb-2">หมายเหตุ · Note (ไม่จำเป็น)</div>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="เช่น: ลูกค้านัดรับวันศุกร์ ต้องได้ก่อนบ่าย · Optional note for Gift"
              rows={2}
              className="w-full border-2 border-stone-300 focus:border-stone-900 outline-none p-3 text-sm bg-white transition resize-none"
            />
          </div>
        </div>

        {/* Action footer */}
        <div className="border-t-2 border-stone-900 bg-stone-100 px-6 py-4 flex items-center justify-between sticky bottom-0">
          <button onClick={onClose} className="text-sm text-stone-600 hover:text-stone-900 transition">
            ย้อนกลับ · Back
          </button>
          <button
            onClick={handleSend}
            disabled={submitting || cartLines.length === 0}
            className="px-8 py-3 bg-stone-900 text-stone-50 font-semibold text-sm hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            {submitting ? (
              <><Loader size={16} className="animate-spin" /> กำลังส่ง...</>
            ) : (
              <>ส่งคำสั่งซื้อไปที่ Gift <Send size={16} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ORDERS VIEW
// ─────────────────────────────────────────────────────────────

function OrdersView({ role }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-6 pb-3 border-b-2 border-stone-900">
        <div>
          <h2 className="font-display text-2xl font-bold">คำสั่งซื้อที่เปิดอยู่</h2>
          <p className="text-xs font-mono text-stone-500 uppercase tracking-widest mt-1">Open Orders · {role === "customer" ? "รายการที่คุณสั่ง" : "คำสั่งซื้อจากลูกค้า"}</p>
        </div>
      </div>

      <div className="space-y-4">
        {OPEN_ORDERS.map(order => (
          <div key={order.id} className="border-2 border-stone-900 bg-white">
            <div className="bg-stone-100 px-5 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-stone-900">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                <span className="font-mono text-xs uppercase tracking-widest text-stone-500">{order.id}</span>
                <span className="text-sm"><span className="text-stone-500">สั่งวันที่</span> <span className="font-mono">{order.date}</span></span>
                <span className="text-sm"><span className="text-stone-500">ส่ง</span> <span className="font-semibold">{order.destination}</span></span>
              </div>
              <StatusBadge status={order.status} />
            </div>
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase tracking-widest font-mono text-stone-500">
                <tr className="border-b border-stone-200">
                  <th className="text-left py-2 px-5 font-medium">สี · Shade</th>
                  <th className="text-right py-2 px-5 font-medium">สั่ง · Ordered</th>
                  <th className="text-right py-2 px-5 font-medium">ได้ · Fulfilled</th>
                  <th className="text-left py-2 px-5 font-medium">สถานะ · Status</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => (
                  <tr key={i} className="border-b border-stone-100 last:border-b-0">
                    <td className="py-2.5 px-5 font-medium">{item.shade}</td>
                    <td className="py-2.5 px-5 text-right font-mono tabular">
                      {item.rolls} <span className="text-stone-400 text-xs">พับ</span> · {item.kg} <span className="text-stone-400 text-xs">โล</span>
                    </td>
                    <td className="py-2.5 px-5 text-right font-mono tabular">
                      {item.status === "ready" || item.status === "shipped" ? `${item.rolls} พับ` : item.fulfilled ? `${item.fulfilled} พับ` : "—"}
                    </td>
                    <td className="py-2.5 px-5"><ItemStatusPill status={item.status} note={item.note} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    partial: { label: "บางส่วน · Partial", cls: "bg-amber-500 text-stone-900" },
    shipped: { label: "ส่งแล้ว · Shipped", cls: "bg-emerald-700 text-stone-50" },
    pending: { label: "รอ · Pending", cls: "bg-stone-400 text-stone-50" },
  };
  const s = map[status] || map.pending;
  return <span className={`text-xs font-mono uppercase tracking-widest px-3 py-1 ${s.cls}`}>{s.label}</span>;
}

function ItemStatusPill({ status, note }) {
  const config = {
    ready: { icon: Check, cls: "text-emerald-700", label: "ครบ · Ready" },
    shipped: { icon: Truck, cls: "text-emerald-700", label: "ส่งแล้ว · Shipped" },
    partial: { icon: TrendingDown, cls: "text-amber-700", label: "ขาด · Short" },
    waiting: { icon: Clock, cls: "text-stone-500", label: note || "รอ · Waiting" },
  };
  const c = config[status] || config.waiting;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${c.cls}`}>
      <Icon size={12} strokeWidth={2} /> {c.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// ADMIN VIEW (Gift manual entry)
// ─────────────────────────────────────────────────────────────

function AdminView() {
  const [form, setForm] = useState({ sku: "208CMSJ/36", shade: "", rolls: "", weight: "", ribWeight: "", lotNo: "", batchNo: "", eta: "" });

  return (
    <div>
      <div className="flex items-baseline justify-between mb-6 pb-3 border-b-2 border-stone-900">
        <div>
          <h2 className="font-display text-2xl font-bold">กรอกข้อมูลสต๊อก</h2>
          <p className="text-xs font-mono text-stone-500 uppercase tracking-widest mt-1">Data Entry · Gift's Backend</p>
          <p className="text-sm text-stone-600 mt-2">กรอกสต๊อกที่เพิ่งเข้าจากโรงย้อม · ข้อมูลจะเห็นได้ทันทีจากฝั่งลูกค้า</p>
        </div>
        <span className="text-xs font-mono uppercase tracking-widest bg-amber-700 text-stone-50 px-3 py-1.5">Provider Mode</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 border-2 border-stone-900 bg-white p-6">
          <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <Plus size={18} strokeWidth={2} /> สต๊อกที่เข้าใหม่ <span className="text-xs font-mono text-stone-500 font-normal">· New Stock Arrival</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field labelTh="รหัสผ้า" labelEn="SKU Code" value={form.sku} onChange={v => setForm({ ...form, sku: v })} mono />
            <Field labelTh="สี" labelEn="Shade · Color" value={form.shade} onChange={v => setForm({ ...form, shade: v })} placeholder="ดำซัลเฟอร์" />
            <Field labelTh="จำนวนพับ" labelEn="Rolls" value={form.rolls} onChange={v => setForm({ ...form, rolls: v })} placeholder="20" type="number" mono />
            <Field labelTh="น้ำหนักรวม (กก.)" labelEn="Total Weight" value={form.weight} onChange={v => setForm({ ...form, weight: v })} placeholder="416.80" type="number" mono />
            <Field labelTh="น้ำหนักริบ (กก.)" labelEn="Rib Weight" value={form.ribWeight} onChange={v => setForm({ ...form, ribWeight: v })} placeholder="42.10" type="number" mono />
            <Field labelTh="เลขล็อต" labelEn="Lot No" value={form.lotNo} onChange={v => setForm({ ...form, lotNo: v })} placeholder="RS2602001-2550-2537" mono />
            <Field labelTh="เบอร์กอง" labelEn="Batch No" value={form.batchNo} onChange={v => setForm({ ...form, batchNo: v })} placeholder="690205038" mono />
            <Field labelTh="นัดโรงย้อม" labelEn="Dye-house ETA" value={form.eta} onChange={v => setForm({ ...form, eta: v })} placeholder="24/04/2569" mono />
          </div>
          <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-stone-200">
            <button className="px-6 py-2.5 bg-stone-900 text-stone-50 text-sm font-medium hover:bg-stone-800 transition">
              บันทึก & เผยแพร่ · Save & Publish
            </button>
            <button className="px-6 py-2.5 border-2 border-stone-300 text-stone-600 text-sm font-medium hover:border-stone-900 hover:text-stone-900 transition">
              บันทึกร่าง · Save Draft
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border-2 border-stone-900 bg-white p-5">
            <div className="text-xs text-stone-700 font-medium">กิจกรรมวันนี้</div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-stone-400 mb-3">Today's Activity</div>
            <div className="space-y-3">
              <ActivityRow labelTh="อัปเดตสต๊อก" labelEn="Stock updates" value="3" />
              <ActivityRow labelTh="คำสั่งซื้อเข้า" labelEn="Orders received" value="2" />
              <ActivityRow labelTh="จัดส่งแล้ว" labelEn="Deliveries" value="1" />
              <ActivityRow labelTh="ลูกค้าเข้าดู" labelEn="Customer views" value="47" />
            </div>
          </div>
          <div className="border-2 border-stone-900 bg-stone-900 text-stone-50 p-5">
            <div className="text-xs font-medium">การเงิน (ซ่อนอยู่)</div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-stone-400 mb-3">Finance (Hidden)</div>
            <div className="text-xs text-stone-400 mb-3">
              ระบบออกบิล, ยอดค้างชำระ, หลักฐานการโอน สร้างแล้วแต่ยังไม่เปิดใช้จนกว่าจะทดสอบเสร็จ
            </div>
            <button disabled className="text-xs font-mono uppercase tracking-widest text-stone-500 cursor-not-allowed">
              <Eye size={12} className="inline mr-1" /> Admin Preview (locked)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ labelTh, labelEn, value, onChange, placeholder, type = "text", mono }) {
  return (
    <label className="block">
      <div className="text-xs text-stone-700 font-medium">{labelTh}</div>
      <div className="text-[10px] font-mono uppercase tracking-widest text-stone-400 mb-1.5">{labelEn}</div>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full border-b-2 border-stone-300 focus:border-stone-900 outline-none py-1.5 text-sm transition ${mono ? "font-mono tabular" : ""}`}
      />
    </label>
  );
}

function ActivityRow({ labelTh, labelEn, value }) {
  return (
    <div className="flex items-baseline justify-between text-sm">
      <div>
        <div className="text-stone-700">{labelTh}</div>
        <div className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">{labelEn}</div>
      </div>
      <span className="font-mono tabular font-semibold text-lg">{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// OCR VIEW — Invoice scan → parse → confirm
// ─────────────────────────────────────────────────────────────

function OCRView() {
  const [stage, setStage] = useState("upload"); // upload | parsing | review | done
  const [parsedData, setParsedData] = useState(null);

  const mockParseInvoice = () => {
    setStage("parsing");
    setTimeout(() => {
      setParsedData({
        billNo: "IV260200074",
        date: "20/02/2569",
        customer: "วัยรุ่นสกรีน",
        destination: "510 หมู่บ้านสวนทอง7 ลำลูกกา ปทุมธานี",
        totalKg: 458.9,
        pricePerKg: 160.0,
        totalBaht: 73424.0,
        lines: [
          {
            lineNo: 1, sku: "30CMRB2/32", desc: "RIB Shade: ขาว 002W", width: '32"-33"',
            rolls: 2, lotNo: "RS2602001-2550-2537", batchNo: "690205038",
            weights: [21.10, 21.00], totalKg: 42.10,
          },
          {
            lineNo: 2, sku: "208CMSJ/36", desc: "Single Jersey Shade: ขาว 002W", width: '36"',
            rolls: 20, lotNo: "RS2602001-2550-2537", batchNo: "690205038",
            weights: [21.30, 21.30, 21.00, 21.30, 21.10, 21.10, 21.10, 20.50, 20.90, 19.90, 19.10, 21.00, 20.90, 20.50, 20.80, 21.10, 21.10, 20.80, 20.90, 21.10],
            totalKg: 416.80,
          },
        ],
      });
      setStage("review");
    }, 1800);
  };

  const confirmImport = () => {
    setStage("done");
    setTimeout(() => { setStage("upload"); setParsedData(null); }, 3500);
  };

  return (
    <div>
      <div className="flex items-baseline justify-between mb-6 pb-3 border-b-2 border-stone-900">
        <div>
          <h2 className="font-display text-2xl font-bold">สแกนบิลเข้าระบบ</h2>
          <p className="text-xs font-mono text-stone-500 uppercase tracking-widest mt-1">OCR Invoice Intake</p>
          <p className="text-sm text-stone-600 mt-2">อัปโหลดใบขายผ้าสี (เช่น IV260200074) → ระบบดึงข้อมูลอัตโนมัติ → ยืนยันแล้วเข้าสต๊อก</p>
        </div>
        <span className="text-xs font-mono uppercase tracking-widest bg-amber-700 text-stone-50 px-3 py-1.5">Provider Mode</span>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-0 mb-8">
        {[
          { id: "upload", th: "อัปโหลด", en: "Upload" },
          { id: "parsing", th: "ดึงข้อมูล", en: "Parse" },
          { id: "review", th: "ตรวจสอบ", en: "Review" },
          { id: "done", th: "เสร็จ", en: "Done" },
        ].map((s, i, arr) => {
          const stages = ["upload", "parsing", "review", "done"];
          const currentIdx = stages.indexOf(stage);
          const thisIdx = stages.indexOf(s.id);
          const done = thisIdx < currentIdx;
          const active = thisIdx === currentIdx;
          return (
            <div key={s.id} className="flex items-center flex-1">
              <div className={`flex items-center gap-2 ${active ? "text-stone-900" : done ? "text-emerald-700" : "text-stone-400"}`}>
                <div className={`w-7 h-7 flex items-center justify-center text-xs font-mono font-semibold border-2 ${active ? "bg-stone-900 text-stone-50 border-stone-900" : done ? "bg-emerald-700 text-stone-50 border-emerald-700" : "border-stone-300"}`}>
                  {done ? <Check size={14} strokeWidth={2.5} /> : i + 1}
                </div>
                <div>
                  <div className="text-sm font-medium">{s.th}</div>
                  <div className="text-[10px] font-mono uppercase tracking-widest">{s.en}</div>
                </div>
              </div>
              {i < arr.length - 1 && (
                <div className={`flex-1 h-[2px] mx-3 ${thisIdx < currentIdx ? "bg-emerald-700" : "bg-stone-200"}`}></div>
              )}
            </div>
          );
        })}
      </div>

      {/* STAGE: UPLOAD */}
      {stage === "upload" && (
        <div className="border-2 border-dashed border-stone-400 bg-white p-12 text-center">
          <Upload size={40} strokeWidth={1.5} className="mx-auto text-stone-400 mb-4" />
          <div className="font-display text-xl font-semibold mb-1">ลากใบบิลมาวางที่นี่</div>
          <div className="text-xs font-mono text-stone-500 uppercase tracking-widest mb-4">Drop invoice image here · PNG, JPG, PDF</div>
          <div className="flex items-center justify-center gap-3">
            <button onClick={mockParseInvoice} className="px-6 py-2.5 bg-stone-900 text-stone-50 text-sm font-medium hover:bg-stone-800 transition flex items-center gap-2">
              <Upload size={14} /> เลือกไฟล์ · Choose File
            </button>
            <button onClick={mockParseInvoice} className="px-6 py-2.5 border-2 border-stone-300 text-stone-600 text-sm font-medium hover:border-stone-900 hover:text-stone-900 transition flex items-center gap-2">
              <Camera size={14} /> ถ่ายรูป · Take Photo
            </button>
          </div>
          <div className="mt-8 text-xs text-stone-500">
            <div className="font-mono uppercase tracking-widest mb-1">ระบบจะดึงข้อมูลต่อไปนี้อัตโนมัติ</div>
            <div>เลขบิล · วันที่ · รหัสผ้า (SKU) · จำนวนพับ · น้ำหนักแต่ละม้วน · เลขล็อต · เบอร์กอง</div>
          </div>
        </div>
      )}

      {/* STAGE: PARSING */}
      {stage === "parsing" && (
        <div className="border-2 border-stone-900 bg-white p-16 text-center">
          <Loader size={40} strokeWidth={1.5} className="mx-auto text-amber-700 mb-4 animate-spin" />
          <div className="font-display text-xl font-semibold mb-1">กำลังอ่านข้อมูลจากบิล...</div>
          <div className="text-xs font-mono text-stone-500 uppercase tracking-widest">Extracting data from invoice · ~2 seconds</div>
          <div className="mt-6 max-w-md mx-auto">
            <div className="h-1 bg-stone-200 overflow-hidden">
              <div className="h-full bg-amber-600 animate-pulse" style={{ width: "65%" }}></div>
            </div>
          </div>
        </div>
      )}

      {/* STAGE: REVIEW */}
      {stage === "review" && parsedData && (
        <div className="space-y-6">
          <div className="border-2 border-stone-900 bg-white">
            <div className="bg-stone-100 px-5 py-3 border-b border-stone-900 flex items-center justify-between">
              <div>
                <div className="font-display text-lg font-semibold">ใบขายผ้าสี · Bill {parsedData.billNo}</div>
                <div className="text-xs font-mono text-stone-500">DATE: {parsedData.date} · {parsedData.customer}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-mono uppercase tracking-widest text-stone-500">รวม · Total</div>
                <div className="font-display text-2xl font-bold tabular">฿{parsedData.totalBaht.toLocaleString()}</div>
              </div>
            </div>

            <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-stone-200">
              <InfoCell labelTh="น้ำหนักรวม" labelEn="Total kg" value={parsedData.totalKg.toFixed(2)} unit="กก." />
              <InfoCell labelTh="ราคาต่อโล" labelEn="Price/kg" value={parsedData.pricePerKg.toFixed(2)} unit="฿" />
              <InfoCell labelTh="จำนวนรายการ" labelEn="Lines" value={parsedData.lines.length} unit="รายการ" />
              <InfoCell labelTh="จำนวนพับ" labelEn="Rolls" value={parsedData.lines.reduce((a, b) => a + b.rolls, 0)} unit="พับ" />
            </div>

            {parsedData.lines.map((line, i) => (
              <div key={i} className="p-5 border-b border-stone-200 last:border-b-0">
                <div className="flex items-baseline justify-between mb-2">
                  <div>
                    <span className="font-mono text-xs uppercase tracking-widest text-stone-500 mr-3">#{line.lineNo}</span>
                    <span className="font-mono font-semibold">{line.sku}</span>
                    <span className="text-sm text-stone-600 ml-2">{line.desc}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono tabular text-lg font-semibold">{line.totalKg.toFixed(2)} <span className="text-xs text-stone-500">กก.</span></div>
                    <div className="text-[10px] font-mono text-stone-500 uppercase tracking-widest">{line.rolls} พับ · {line.width}</div>
                  </div>
                </div>
                <div className="text-xs font-mono text-stone-500 mb-2">Lot: {line.lotNo} · เบอร์กอง: {line.batchNo}</div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-stone-400 mb-1">น้ำหนักแต่ละม้วน (กก.)</div>
                <div className="flex flex-wrap gap-1.5">
                  {line.weights.map((w, wi) => (
                    <span key={wi} className="font-mono tabular text-xs bg-stone-100 border border-stone-200 px-2 py-0.5">{w.toFixed(2)}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="border-l-4 border-emerald-600 bg-emerald-50 px-5 py-3">
            <div className="flex items-start gap-2">
              <Check size={16} className="text-emerald-700 mt-0.5 shrink-0" strokeWidth={2.5} />
              <div className="text-sm text-emerald-900">
                <div className="font-semibold mb-0.5">ตรวจสอบข้อมูลให้ถูกต้องก่อนยืนยัน</div>
                <div className="text-xs text-emerald-800">ถ้าข้อมูลถูกต้องทั้งหมด กดยืนยันเพื่อเพิ่มเข้าสต๊อก · ลูกค้าจะเห็นทันทีในระบบ</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button onClick={() => setStage("upload")} className="text-sm text-stone-600 hover:text-stone-900 transition flex items-center gap-1.5">
              <ArrowLeft size={14} /> อัปโหลดใหม่ · Re-upload
            </button>
            <button onClick={confirmImport} className="px-8 py-3 bg-stone-900 text-stone-50 font-semibold text-sm hover:bg-stone-800 transition flex items-center gap-2">
              ยืนยัน & เพิ่มเข้าสต๊อก · Confirm & Import <Check size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}

      {/* STAGE: DONE */}
      {stage === "done" && (
        <div className="border-2 border-emerald-700 bg-emerald-50 p-12 text-center">
          <div className="w-14 h-14 mx-auto bg-emerald-700 flex items-center justify-center mb-4">
            <Check size={28} strokeWidth={3} className="text-white" />
          </div>
          <div className="font-display text-2xl font-bold mb-1 text-emerald-900">เพิ่มเข้าสต๊อกเรียบร้อย</div>
          <div className="text-sm text-emerald-800">2 รายการ · 22 พับ · 458.90 กก. · นำเข้าสำเร็จ</div>
          <div className="text-xs font-mono text-emerald-700 uppercase tracking-widest mt-2">Imported to live stock · Visible to customers now</div>
        </div>
      )}
    </div>
  );
}

function InfoCell({ labelTh, labelEn, value, unit }) {
  return (
    <div>
      <div className="text-xs text-stone-700 font-medium">{labelTh}</div>
      <div className="text-[10px] font-mono uppercase tracking-widest text-stone-400 mb-1">{labelEn}</div>
      <div className="font-mono tabular text-lg font-semibold">{value} <span className="text-xs text-stone-500">{unit}</span></div>
    </div>
  );
}
