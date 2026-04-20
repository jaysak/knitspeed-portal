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

      // Fetch all stock items (fabric + rib)
      const { data: stockData, error: stockError } = await supabase
        .from('stock')
        .select('*')
        .order('group_id', { ascending: true })
        .order('shade', { ascending: true })

      if (stockError) throw stockError

      // Group by group_id and pair fabric with rib
      const groupMap = {}
      
      stockData.forEach(item => {
        if (!groupMap[item.group_id]) {
          groupMap[item.group_id] = {
            id: item.group_id,
            title: getGroupTitle(item.group_id),
            subtitle: getGroupSubtitle(item.group_id),
            width: item.width_inches ? `${item.width_inches}"` : '36"',
            rows: []
          }
        }

        // For fabric items, create a row and look for matching rib
        if (item.item_type === 'fabric') {
          const ribItem = stockData.find(rib => 
            rib.item_type === 'rib' && rib.sku === item.rib_sku_ref
          )

          groupMap[item.group_id].rows.push({
            shade: item.shade,
            gsm: item.price_per_kg?.toString() || '0', // Legacy JSX expects gsm field
            price_per_kg: item.price_per_kg || 0, // Actual price data
            code: item.dye_code || item.sku,
            readyRolls: item.ready_rolls || 0,
            readyRib: ribItem?.ready_rolls || 0,
            dyeRolls: item.dye_rolls || 0,
            dyeRib: ribItem?.dye_rolls || 0,
            dateIn: item.created_at ? new Date(item.created_at).toLocaleDateString('th-TH') : null,
            note: item.note,
            ratio: item.ratio || 'ok'
          })
        }
      })

      // Convert to array format expected by UI
      const groupsArray = Object.values(groupMap)
      setGroups(groupsArray)

    } catch (err) {
      console.error('Error fetching stock:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStock()
  }, [])

  return { groups, loading, error, refresh: fetchStock }
}

// Helper functions to map group_id to display strings
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
