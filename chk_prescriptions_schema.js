require('dotenv').config({path: '.env.local'})
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
async function run() {
  const { data, error } = await sb.from('prescriptions').select('*').limit(1)
  if (!error) console.log(`Columns for prescriptions:`, Object.keys(data[0] || {}))
  else console.log(`Error fetching prescriptions:`, error.message)
}
run()
