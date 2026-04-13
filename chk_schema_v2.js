require('dotenv').config({path: '.env.local'})
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

async function getCols(table) {
  // Use a query on information_schema.columns
  const { data, error } = await sb.rpc('exec_sql', { 
    query: `SELECT column_name FROM information_schema.columns WHERE table_name = '${table}' AND table_schema = 'public'` 
  })
  if (error) {
     // If exec_sql RPC doesn't exist, try another way
     console.error(`Error querying info schema for ${table}:`, error.message)
     // Fallback: try fetching one record and logging error
     const { data: d, error: e } = await sb.from(table).select('*').limit(1)
     if (d && d.length > 0) {
        console.log(`Columns for ${table}:`, Object.keys(d[0]))
     } else if (e) {
        console.log(`Select * error for ${table}:`, e.message)
     } else {
        console.log(`Table ${table} is empty.`)
     }
  } else {
     console.log(`Columns for ${table}:`, data.map(c => c.column_name).join(', '))
  }
}

async function run() {
  await getCols('medicalrecords')
  await getCols('imagingstudies')
  await getCols('prescriptions')
  await getCols('appointments')
}
run()
