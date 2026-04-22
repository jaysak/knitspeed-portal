#!/usr/bin/env python3
"""
apply_item6.py — Apply Item 6 (shareable stock-link) patches to src/StockPortal.jsx.

Four edits, all on src/StockPortal.jsx:
  1. Add Link2 + Copy icons to lucide-react import.
  2. Add URL-param parsing + skuFilter state + extend filteredGroups memo (includes row.sku in search).
  3. Add a copy-link icon button inside the shade cell.
  4. Pass skuFilter through to StockView so the banner can show "filtered to X" with a clear button.

Run from repo root:  python3 apply_item6.py

Prints pass/fail per edit. If any edit fails, the file is NOT modified.
"""
import re
import sys
from pathlib import Path

PATH = Path('src/StockPortal.jsx')

if not PATH.exists():
    print(f"FAIL: {PATH} not found. Run from repo root.")
    sys.exit(1)

src = PATH.read_text()
original = src

# ─────────────────────────────────────────────────────────────
# EDIT 1: Add Link2 + Copy to lucide import
# ─────────────────────────────────────────────────────────────
old1 = '  ArrowLeft, MapPin, Zap, Send, Scan\n} from "lucide-react";'
new1 = '  ArrowLeft, MapPin, Zap, Send, Scan, Link2, Copy, Check as CheckIcon\n} from "lucide-react";'

if old1 not in src:
    print("FAIL edit 1: lucide import line not matched.")
    sys.exit(1)
src = src.replace(old1, new1, 1)
print("OK edit 1: added Link2, Copy, CheckIcon to lucide import.")

# ─────────────────────────────────────────────────────────────
# EDIT 2: Add URL-param parsing + skuFilter state + extend filteredGroups
#
# Replace the block from `const [orderSent, ...` through the closing of the
# filteredGroups memo.
# ─────────────────────────────────────────────────────────────
old2 = '''  const [orderSent, setOrderSent] = useState(false);

  const { groups: stockGroups, loading: stockLoading, error: stockError, refresh } = useStock();

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
  }, [stockGroups, search]);'''

new2 = '''  const [orderSent, setOrderSent] = useState(false);
  const [skuFilter, setSkuFilter] = useState(null);
  const [groupFilter, setGroupFilter] = useState(null);

  // Item 6: read URL params on mount — ?sku= / ?q= / ?group=
  // Used by Gift to share a stock link with customers via LINE.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sku = params.get('sku');
    const q = params.get('q');
    const group = params.get('group');
    if (sku) setSkuFilter(sku);
    if (q) setSearch(q);
    if (group) setGroupFilter(group);
  }, []);

  const clearFilters = () => {
    setSkuFilter(null);
    setGroupFilter(null);
    setSearch('');
    // Also clear the URL so a refresh doesn't re-apply the filter.
    if (window.history.replaceState) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  const { groups: stockGroups, loading: stockLoading, error: stockError, refresh } = useStock();

  const filteredGroups = useMemo(() => {
    if (!stockGroups) return [];
    const q = search.trim().toLowerCase();
    const hasAnyFilter = q || skuFilter || groupFilter;
    if (!hasAnyFilter) return stockGroups;

    return stockGroups
      .filter(group => !groupFilter || group.id === groupFilter || group.title.toLowerCase().includes(groupFilter.toLowerCase()))
      .map(group => ({
        ...group,
        rows: group.rows.filter(row => {
          if (skuFilter && row.sku !== skuFilter && row.ribSku !== skuFilter) return false;
          if (!q) return true;
          return (
            row.shade.toLowerCase().includes(q) ||
            row.code.toLowerCase().includes(q) ||
            (row.sku || '').toLowerCase().includes(q) ||
            group.title.toLowerCase().includes(q)
          );
        })
      }))
      .filter(group => group.rows.length > 0);
  }, [stockGroups, search, skuFilter, groupFilter]);'''

if old2 not in src:
    print("FAIL edit 2: filteredGroups block not matched.")
    sys.exit(1)
src = src.replace(old2, new2, 1)
print("OK edit 2: URL-param parsing + skuFilter state + extended memo.")

# ─────────────────────────────────────────────────────────────
# EDIT 3: Pass skuFilter/groupFilter/clearFilters to StockView
# ─────────────────────────────────────────────────────────────
old3 = '            search={search}'
new3 = '''            search={search}
            skuFilter={skuFilter}
            groupFilter={groupFilter}
            clearFilters={clearFilters}'''

# There's only one call site rendering StockView with `search={search}`.
# Check count to be safe.
if src.count(old3) != 1:
    print(f"FAIL edit 3: expected 1 `search={{search}}` occurrence, got {src.count(old3)}.")
    sys.exit(1)
src = src.replace(old3, new3, 1)
print("OK edit 3: passed skuFilter/groupFilter/clearFilters props.")

# ─────────────────────────────────────────────────────────────
# EDIT 4a: Update StockView signature to accept the new props
# ─────────────────────────────────────────────────────────────
old4a = 'function StockView({ role, search, setSearch, groups, loading, error, refresh, cart, setCart }) {'
new4a = 'function StockView({ role, search, setSearch, groups, loading, error, refresh, cart, setCart, skuFilter, groupFilter, clearFilters }) {'

if old4a not in src:
    print("FAIL edit 4a: StockView signature not matched.")
    sys.exit(1)
src = src.replace(old4a, new4a, 1)
print("OK edit 4a: StockView signature extended.")

# ─────────────────────────────────────────────────────────────
# EDIT 4b: Add CopyLinkButton component + inject into shade cell.
#
# Inject CopyLinkButton definition RIGHT AFTER the lucide import block
# (search for a stable landmark: "// MAIN COMPONENT" comment).
# ─────────────────────────────────────────────────────────────
old4b = '// ─────────────────────────────────────────────────────────────\n// MAIN COMPONENT\n// ─────────────────────────────────────────────────────────────'

new4b = '''// ─────────────────────────────────────────────────────────────
// SHAREABLE STOCK-LINK (Item 6)
// ─────────────────────────────────────────────────────────────

function CopyLinkButton({ sku }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}?sku=${encodeURIComponent(sku)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      // Fallback for older browsers: select a hidden textarea.
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 1800); }
      catch (e2) { console.error('Copy failed', e2); }
      document.body.removeChild(ta);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-widest text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition rounded"
      title={`คัดลอกลิงก์ SKU ${sku}`}
      aria-label={`คัดลอกลิงก์ SKU ${sku}`}
    >
      {copied ? (
        <>
          <CheckIcon size={11} strokeWidth={2} className="text-emerald-600" />
          <span className="text-emerald-700">คัดลอกแล้ว</span>
        </>
      ) : (
        <>
          <Link2 size={11} strokeWidth={1.5} />
          <span>ลิงก์</span>
        </>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────'''

if old4b not in src:
    print("FAIL edit 4b: MAIN COMPONENT landmark not matched.")
    sys.exit(1)
src = src.replace(old4b, new4b, 1)
print("OK edit 4b: inserted CopyLinkButton component.")

# ─────────────────────────────────────────────────────────────
# EDIT 4c: Inject <CopyLinkButton sku={row.sku} /> into the shade cell.
#
# Target the shade cell's inner block. Row shade cell is:
#   <td className="py-2.5 px-3 border-r border-stone-200">
#     <div className="font-medium text-stone-900">{row.shade}</div>
#     <div className="text-[10px] text-stone-500 font-mono">ratio: {row.ratio || 'ok'}</div>
#   </td>
# ─────────────────────────────────────────────────────────────
old4c = '''                            <td className="py-2.5 px-3 border-r border-stone-200">
                              <div className="font-medium text-stone-900">{row.shade}</div>
                              <div className="text-[10px] text-stone-500 font-mono">ratio: {row.ratio || 'ok'}</div>
                            </td>'''

new4c = '''                            <td className="py-2.5 px-3 border-r border-stone-200">
                              <div className="font-medium text-stone-900 flex items-center gap-2">
                                <span>{row.shade}</span>
                                <CopyLinkButton sku={row.sku} />
                              </div>
                              <div className="text-[10px] text-stone-500 font-mono">ratio: {row.ratio || 'ok'}</div>
                            </td>'''

if old4c not in src:
    print("FAIL edit 4c: shade cell block not matched.")
    sys.exit(1)
src = src.replace(old4c, new4c, 1)
print("OK edit 4c: copy-link button injected into shade cell.")

# ─────────────────────────────────────────────────────────────
# EDIT 5: Add "filtered" banner inside StockView.
# Place it right after the stats bar (near the "รีเฟรช · Refresh" button line).
# Landmark: the grid-cols-2 ready/dye legend block opener.
# ─────────────────────────────────────────────────────────────
old5 = '        <div className="grid grid-cols-2 gap-0 mb-6 border-2 border-stone-900 bg-white text-xs">'
new5 = '''        {(skuFilter || groupFilter) && (
          <div className="mb-4 border-2 border-amber-600 bg-amber-50 px-3 py-2 flex items-center justify-between text-xs">
            <div className="font-mono">
              <span className="uppercase tracking-widest text-amber-800">กรองอยู่ · Filtered:</span>{' '}
              {skuFilter && <span className="font-bold text-stone-900">SKU {skuFilter}</span>}
              {skuFilter && groupFilter && <span> · </span>}
              {groupFilter && <span className="font-bold text-stone-900">กลุ่ม {groupFilter}</span>}
            </div>
            <button
              onClick={clearFilters}
              className="font-mono uppercase tracking-widest text-amber-800 hover:text-amber-900 underline"
            >
              ล้างตัวกรอง · Clear
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-0 mb-6 border-2 border-stone-900 bg-white text-xs">'''

if src.count(old5) != 1:
    print(f"FAIL edit 5: expected 1 `grid grid-cols-2` legend line, got {src.count(old5)}.")
    sys.exit(1)
src = src.replace(old5, new5, 1)
print("OK edit 5: filter-active banner added to StockView.")

# ─────────────────────────────────────────────────────────────
# Write if everything passed
# ─────────────────────────────────────────────────────────────
if src == original:
    print("FAIL: no changes written.")
    sys.exit(1)

PATH.write_text(src)
print("\nAll 6 edits applied successfully.")
print(f"File size: {len(original)} → {len(src)} chars")
