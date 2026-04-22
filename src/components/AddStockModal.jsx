import { useState, useEffect, useMemo } from 'react';
import { X, Check, Loader, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

// ─────────────────────────────────────────────────────────────
// ADD STOCK MODAL — Item 3a
// Path B: manual single-add of a new SKU (fabric, rib, or pair).
// Path A (bulk import) is out of scope; see decision doc 2026-04-23.
// ─────────────────────────────────────────────────────────────

const SKU_RE_FABRIC = (group, shade, width) =>
  `${group}-${shade}/${width}`;
const SKU_RE_RIB = (group, shade, width) =>
  `${group}-${shade}-RIB/${width}`;

export default function AddStockModal({ existingRows, onSave, onClose }) {
  // ── derived: known groups + per-group typical widths ──────
  const knownGroups = useMemo(() => {
    const set = new Set(existingRows.map(r => r.group_id).filter(Boolean));
    return Array.from(set).sort();
  }, [existingRows]);

  const groupWidths = useMemo(() => {
    // { groupId: { fabricWidth, ribWidth } } — per-group sample widths
    const map = {};
    for (const r of existingRows) {
      if (!r.group_id || !r.width_inches) continue;
      if (!map[r.group_id]) map[r.group_id] = { fabric: null, rib: null };
      if (r.item_type === 'fabric' && map[r.group_id].fabric == null) {
        map[r.group_id].fabric = Number(r.width_inches);
      }
      if (r.item_type === 'rib' && map[r.group_id].rib == null) {
        map[r.group_id].rib = Number(r.width_inches);
      }
    }
    return map;
  }, [existingRows]);

  // ── form state ────────────────────────────────────────────
  const [groupMode, setGroupMode] = useState('existing'); // 'existing' | 'new'
  const [groupId, setGroupId] = useState(knownGroups[0] || '');
  const [newGroupId, setNewGroupId] = useState('');

  const [itemType, setItemType] = useState('fabric'); // 'fabric' | 'rib'
  const [pairOn, setPairOn] = useState(true);

  const [shade, setShade] = useState('');
  const [shadeEn, setShadeEn] = useState('');
  const [dyeCode, setDyeCode] = useState('');

  const [widthInches, setWidthInches] = useState('');
  const [yarnSpec, setYarnSpec] = useState('');
  const [pricePerKg, setPricePerKg] = useState('');

  const [readyRolls, setReadyRolls] = useState(0);
  const [readyKg, setReadyKg] = useState(0);
  const [dyeRolls, setDyeRolls] = useState(0);
  const [dyeKg, setDyeKg] = useState(0);
  const [etaDate, setEtaDate] = useState('');
  const [note, setNote] = useState('');

  const [overrideSku, setOverrideSku] = useState(false);
  const [skuOverride, setSkuOverride] = useState('');
  const [ribSkuOverride, setRibSkuOverride] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // ── effective values ──────────────────────────────────────
  const effectiveGroup = groupMode === 'new' ? newGroupId.trim() : groupId;

  // Auto-fill width from group typical when group changes (don't clobber user input)
  useEffect(() => {
    if (!effectiveGroup) return;
    const w = groupWidths[effectiveGroup];
    if (!w) return;
    if (widthInches === '') {
      const def = itemType === 'fabric' ? w.fabric : w.rib;
      if (def != null) setWidthInches(String(def));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveGroup, itemType]);

  // Pair toggle is hidden when type=rib (no auto-paired fabric)
  useEffect(() => {
    if (itemType === 'rib') setPairOn(false);
  }, [itemType]);

  // Rib width default: per-group rib min if exists, else fabric_width - 4, else 32
  const computedRibWidth = useMemo(() => {
    if (!effectiveGroup) return 32;
    const w = groupWidths[effectiveGroup];
    if (w && w.rib != null) return w.rib;
    const fw = parseFloat(widthInches);
    if (!Number.isNaN(fw) && fw > 0) return Math.max(fw - 4, 1);
    return 32;
  }, [effectiveGroup, groupWidths, widthInches]);

  // Auto-generated SKUs (live preview)
  const autoSku = useMemo(() => {
    if (!effectiveGroup || !shade.trim() || !widthInches) return '';
    const w = parseFloat(widthInches);
    if (Number.isNaN(w) || w <= 0) return '';
    return itemType === 'fabric'
      ? SKU_RE_FABRIC(effectiveGroup, shade.trim(), w)
      : SKU_RE_RIB(effectiveGroup, shade.trim(), w);
  }, [effectiveGroup, shade, widthInches, itemType]);

  const autoRibSku = useMemo(() => {
    if (!pairOn || itemType !== 'fabric') return '';
    if (!effectiveGroup || !shade.trim()) return '';
    return SKU_RE_RIB(effectiveGroup, shade.trim(), computedRibWidth);
  }, [pairOn, itemType, effectiveGroup, shade, computedRibWidth]);

  const finalSku = overrideSku && skuOverride.trim() ? skuOverride.trim() : autoSku;
  const finalRibSku = overrideSku && ribSkuOverride.trim() ? ribSkuOverride.trim() : autoRibSku;

  // ── validation ────────────────────────────────────────────
  const validate = () => {
    if (!effectiveGroup) return 'Group is required.';
    if (groupMode === 'new' && !newGroupId.trim()) return 'New group name is required.';
    if (!shade.trim()) return 'Shade (TH) is required.';
    const w = parseFloat(widthInches);
    if (Number.isNaN(w) || w <= 0) return 'Width must be > 0.';
    for (const [label, v] of [
      ['พร้อมส่ง rolls', readyRolls], ['พร้อมส่ง kg', readyKg],
      ['โรงย้อม rolls', dyeRolls], ['โรงย้อม kg', dyeKg],
    ]) {
      if (Number(v) < 0) return `${label} must be ≥ 0.`;
    }
    if (!finalSku) return 'SKU could not be generated. Check group / shade / width.';
    if (pairOn && itemType === 'fabric' && !finalRibSku) return 'Rib SKU could not be generated.';
    return null;
  };

  // ── duplicate pre-check ───────────────────────────────────
  const checkDuplicates = async () => {
    const candidates = [finalSku];
    if (pairOn && itemType === 'fabric') candidates.push(finalRibSku);
    const { data, error: err } = await supabase
      .from('stock')
      .select('sku')
      .in('sku', candidates);
    if (err) throw err;
    if (data && data.length > 0) {
      const dupes = data.map(r => r.sku).join(', ');
      throw new Error(`SKU already exists: ${dupes}`);
    }
  };

  // ── submit ────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError(null);
    const v = validate();
    if (v) { setError(v); return; }

    setSaving(true);
    try {
      await checkDuplicates();

      const baseFabric = {
        group_id: effectiveGroup,
        item_type: 'fabric',
        sku: finalSku,
        shade: shade.trim(),
        shade_en: shadeEn.trim() || null,
        dye_code: dyeCode.trim() || null,
        width_inches: parseFloat(widthInches),
        yarn_spec: yarnSpec.trim() || null,
        price_per_kg: pricePerKg === '' ? null : parseFloat(pricePerKg),
        ready_rolls: parseInt(readyRolls) || 0,
        ready_kg: parseFloat(readyKg) || 0,
        dye_rolls: parseInt(dyeRolls) || 0,
        dye_kg: parseFloat(dyeKg) || 0,
        eta_date: etaDate || null,
        note: note.trim() || null,
        ratio: 'ok',
      };

      const baseRib = {
        group_id: effectiveGroup,
        item_type: 'rib',
        shade: shade.trim(),
        shade_en: shadeEn.trim() || null,
        dye_code: dyeCode.trim() || null,
        width_inches: computedRibWidth,
        yarn_spec: yarnSpec.trim() || null,
        price_per_kg: pricePerKg === '' ? null : parseFloat(pricePerKg),
        ready_rolls: 0,
        ready_kg: 0,
        dye_rolls: 0,
        dye_kg: 0,
        eta_date: null,
        note: note.trim() || null,
        ratio: 'ok',
      };

      // CASE 1: rib-only (no pair)
      if (itemType === 'rib') {
        const { error: err } = await supabase.from('stock').insert({
          ...baseFabric,
          item_type: 'rib',
          sku: finalSku,
        });
        if (err) throw err;
        await onSave({ count: 1 });
        return;
      }

      // CASE 2: fabric only (pair toggled off)
      if (!pairOn) {
        const { error: err } = await supabase.from('stock').insert(baseFabric);
        if (err) throw err;
        await onSave({ count: 1 });
        return;
      }

      // CASE 3: fabric + rib pair — rib first so fabric.rib_sku_ref has a target
      const ribRow = { ...baseRib, sku: finalRibSku };
      const { data: ribInserted, error: ribErr } = await supabase
        .from('stock')
        .insert(ribRow)
        .select()
        .single();
      if (ribErr) throw new Error(`Rib insert failed: ${ribErr.message}`);

      const fabricRow = { ...baseFabric, rib_sku_ref: ribInserted.sku };
      const { error: fabErr } = await supabase.from('stock').insert(fabricRow);
      if (fabErr) {
        // rollback the rib insert
        await supabase.from('stock').delete().eq('id', ribInserted.id);
        throw new Error(`Fabric insert failed (rib rolled back): ${fabErr.message}`);
      }

      await onSave({ count: 2 });
    } catch (err) {
      console.error('AddStock failed:', err);
      setError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  };

  // ── render ────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white border-4 border-stone-900 max-w-2xl w-full max-h-[90vh] overflow-auto animate-slide-up">
        <div className="bg-stone-900 text-stone-50 p-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h3 className="font-display text-lg font-bold">เพิ่มสต๊อก · Add Stock</h3>
            <div className="text-xs font-mono text-stone-400 mt-1">
              {pairOn && itemType === 'fabric' ? 'Will create fabric + rib pair' : 'Will create one row'}
            </div>
          </div>
          <button onClick={onClose} disabled={saving} className="text-stone-400 hover:text-stone-50 disabled:opacity-50">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Group */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-stone-600 mb-1">Group *</label>
            <div className="flex gap-2">
              <select
                value={groupMode === 'existing' ? groupId : '__new__'}
                onChange={e => {
                  if (e.target.value === '__new__') {
                    setGroupMode('new');
                  } else {
                    setGroupMode('existing');
                    setGroupId(e.target.value);
                    setWidthInches(''); // re-trigger width auto-fill
                  }
                }}
                className="flex-1 border-2 border-stone-900 p-2 font-mono text-sm"
              >
                {knownGroups.map(g => <option key={g} value={g}>{g}</option>)}
                <option value="__new__">+ new group…</option>
              </select>
              {groupMode === 'new' && (
                <input
                  type="text"
                  placeholder="e.g. 30CM"
                  value={newGroupId}
                  onChange={e => setNewGroupId(e.target.value.toUpperCase())}
                  className="flex-1 border-2 border-stone-900 p-2 font-mono text-sm"
                />
              )}
            </div>
          </div>

          {/* Type + pair toggle */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-stone-600 mb-1">Type *</label>
              <div className="flex border-2 border-stone-900">
                <button
                  type="button"
                  onClick={() => setItemType('fabric')}
                  className={`flex-1 py-2 text-sm font-semibold transition ${itemType === 'fabric' ? 'bg-stone-900 text-stone-50' : 'bg-white text-stone-900 hover:bg-stone-100'}`}
                >fabric</button>
                <button
                  type="button"
                  onClick={() => setItemType('rib')}
                  className={`flex-1 py-2 text-sm font-semibold transition border-l-2 border-stone-900 ${itemType === 'rib' ? 'bg-stone-900 text-stone-50' : 'bg-white text-stone-900 hover:bg-stone-100'}`}
                >rib</button>
              </div>
            </div>
            {itemType === 'fabric' && (
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-stone-600 mb-1">Add matching rib?</label>
                <label className="flex items-center gap-2 border-2 border-stone-900 p-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pairOn}
                    onChange={e => setPairOn(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{pairOn ? 'Yes — pair' : 'No — fabric only'}</span>
                </label>
              </div>
            )}
          </div>

          {/* Shade */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-stone-600 mb-1">Shade (TH) *</label>
              <input
                type="text"
                value={shade}
                onChange={e => setShade(e.target.value)}
                placeholder="เช่น ดำ"
                className="w-full border-2 border-stone-900 p-2"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-stone-600 mb-1">Shade (EN)</label>
              <input
                type="text"
                value={shadeEn}
                onChange={e => setShadeEn(e.target.value)}
                placeholder="e.g. black"
                className="w-full border-2 border-stone-900 p-2"
              />
            </div>
          </div>

          {/* Dye + width + yarn + price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-stone-600 mb-1">Dye code</label>
              <input
                type="text"
                value={dyeCode}
                onChange={e => setDyeCode(e.target.value)}
                placeholder="e.g. 78"
                className="w-full border-2 border-stone-900 p-2 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-stone-600 mb-1">Width (inches) *</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={widthInches}
                onChange={e => setWidthInches(e.target.value)}
                className="w-full border-2 border-stone-900 p-2 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-stone-600 mb-1">Yarn spec</label>
              <input
                type="text"
                value={yarnSpec}
                onChange={e => setYarnSpec(e.target.value)}
                placeholder="e.g. TC30/1"
                className="w-full border-2 border-stone-900 p-2 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-stone-600 mb-1">Price/kg (฿)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={pricePerKg}
                onChange={e => setPricePerKg(e.target.value)}
                className="w-full border-2 border-stone-900 p-2 font-mono"
              />
            </div>
          </div>

          {/* SKU preview */}
          <div className="border-2 border-stone-300 bg-stone-50 p-3">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-[11px] font-mono uppercase tracking-widest text-stone-500">Generated SKU{pairOn && itemType === 'fabric' ? 's' : ''}</span>
              <button
                type="button"
                onClick={() => {
                  setOverrideSku(!overrideSku);
                  if (!overrideSku) {
                    setSkuOverride(autoSku);
                    setRibSkuOverride(autoRibSku);
                  }
                }}
                className="text-[11px] font-mono uppercase tracking-widest text-stone-500 hover:text-stone-900 underline"
              >
                {overrideSku ? 'use auto' : 'edit SKU'}
              </button>
            </div>
            {!overrideSku ? (
              <div className="space-y-1">
                <div className="font-mono text-sm">{autoSku || <span className="text-stone-400">—</span>}</div>
                {pairOn && itemType === 'fabric' && (
                  <div className="font-mono text-sm text-rose-700">{autoRibSku || <span className="text-stone-400">—</span>} <span className="text-[10px] text-stone-400">(rib)</span></div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={skuOverride}
                  onChange={e => setSkuOverride(e.target.value)}
                  className="w-full border border-stone-400 p-1.5 font-mono text-sm"
                  placeholder="fabric SKU"
                />
                {pairOn && itemType === 'fabric' && (
                  <input
                    type="text"
                    value={ribSkuOverride}
                    onChange={e => setRibSkuOverride(e.target.value)}
                    className="w-full border border-stone-400 p-1.5 font-mono text-sm text-rose-700"
                    placeholder="rib SKU"
                  />
                )}
              </div>
            )}
          </div>

          {/* Quantities */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-stone-200">
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-stone-600 mb-1">พร้อมส่ง (พับ)</label>
              <input
                type="number" min="0"
                value={readyRolls}
                onChange={e => setReadyRolls(parseInt(e.target.value) || 0)}
                className="w-full border-2 border-stone-900 p-2 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-stone-600 mb-1">พร้อมส่ง (kg)</label>
              <input
                type="number" step="0.01" min="0"
                value={readyKg}
                onChange={e => setReadyKg(parseFloat(e.target.value) || 0)}
                className="w-full border-2 border-stone-900 p-2 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-stone-600 mb-1">โรงย้อม (พับ)</label>
              <input
                type="number" min="0"
                value={dyeRolls}
                onChange={e => setDyeRolls(parseInt(e.target.value) || 0)}
                className="w-full border-2 border-stone-900 p-2 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-stone-600 mb-1">โรงย้อม (kg)</label>
              <input
                type="number" step="0.01" min="0"
                value={dyeKg}
                onChange={e => setDyeKg(parseFloat(e.target.value) || 0)}
                className="w-full border-2 border-stone-900 p-2 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-stone-600 mb-1">
                ETA {dyeRolls > 0 && <span className="text-stone-400 normal-case">· when dye_rolls &gt; 0</span>}
              </label>
              <input
                type="date"
                value={etaDate}
                onChange={e => setEtaDate(e.target.value)}
                className="w-full border-2 border-stone-900 p-2 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-stone-600 mb-1">Note</label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="optional"
                className="w-full border-2 border-stone-900 p-2 text-sm"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="border-2 border-red-700 bg-red-50 p-3 flex gap-2 items-start">
              <AlertTriangle size={16} className="text-red-700 shrink-0 mt-0.5" />
              <div className="text-sm text-red-900">{error}</div>
            </div>
          )}

          {/* Actions */}
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
              {saving
                ? <><Loader size={16} className="animate-spin" /> กำลังบันทึก</>
                : <><Check size={16} /> บันทึก</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
