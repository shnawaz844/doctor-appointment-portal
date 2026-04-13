require('dotenv').config({path: '.env.local'})
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
async function run() {
  const common = ['medical_records', 'prescriptions', 'imaging_studies', 'imaging', 'lab_results']
  for (const t of common) {
    const { data, error } = await sb.from(t).select('*').limit(1)
    if (!error) console.log(`Table exists: ${t}. Columns:`, Object.keys(data[0] || {}))
    else console.log(`Table ${t} check failed: ${error.message}`)
  }
}
run()
