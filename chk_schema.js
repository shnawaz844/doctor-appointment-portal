require('dotenv').config({path: '.env.local'})
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
async function run() {
  const tables = ['patients', 'opd', 'appointments']
  for (const table of tables) {
    const { data, error } = await sb.from(table).select('*').limit(1)
    if (error) console.error(`Error fetching ${table}:`, error)
    else console.log(`Columns for ${table}:`, Object.keys(data[0] || {}))
  }
}
run()
