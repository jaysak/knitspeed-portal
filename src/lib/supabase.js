import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

//if (!supabaseUrl || !supabaseKey) {
//  throw new Error('Missing Supabase environment variables')
//} temporary by gpt

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    `Missing Supabase env vars | URL: ${supabaseUrl} | KEY EXISTS: ${!!supabaseKey}`
  )
}
export const supabase = createClient(supabaseUrl, supabaseKey)
