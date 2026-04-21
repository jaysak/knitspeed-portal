import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useStock() {
  const [groups, setGroups] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStock = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: stockData, error: stockError } = await supabase
        .from('stock')
        .select('*')
        .order('group_id', { ascending: true })
        .order('item_type', { ascending: false })
        .order('shade', { ascending: true })

      if (stockError) throw stockError

      const groupMap = {}

      stockData.forEach(item => {
        if (item.item_type !== 'fabric') return

        if (!groupMap[item.group_id]) {
          groupMap[item.group_id] = {
            id: item.group_id,
            title: getGroupTitle(item.group_id),
            subtitle: getGroupSubtitle(item.group_id),
            width: item.width_inches ? `${item.width_inches}"` : '36"',
            rows: []
          }
        }

        const ribItem = stockData.find(rib =>
          rib.item_type === 'rib' && rib.sku === item.rib_sku_ref
        )

        groupMap[item.group_id].rows.push({
          sku: item.sku,
          shade: item.shade,
          price_per_kg: item.price_per_kg || 0,
          code: item.dye_code || '—',
          readyRolls: item.ready_rolls || 0,
          readyRib: ribItem?.ready_rolls || 0,
          dyeRolls: item.dye_rolls || 0,
          dyeRib: ribItem?.dye_rolls || 0,
          // Rib identity exposed for independent cart key construction
          ribSku: ribItem?.sku || null,
          ribPrice: ribItem?.price_per_kg || 0,
          dateIn: item.created_at ? new Date(item.created_at).toLocaleDateString('th-TH') : null,
          note: item.note,
          ratio: item.ratio || 'ok'
        })
      })

      setGroups(Object.values(groupMap))
    } catch (err) {
      console.error('Error fetching stock:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStock() }, [])

  return { groups, loading, error, refresh: fetchStock }
}

function getGroupTitle(groupId) {
  switch (groupId) {
    case '30cm': return '30CM / เส้นคู่'
    case '20cm': return '20CM'
    case 'other': return 'ผ้าอื่นๆ'
    default: return groupId.toUpperCase()
  }
}

function getGroupSubtitle(groupId) {
  switch (groupId) {
    case '30cm': return '(พร้อมส่ง · width 37")'
    case '20cm': return '(พร้อมส่ง · width 36")'
    case 'other': return '(วอร์ม / เกล็ดปลา / Dry Tech)'
    default: return ''
  }
}
