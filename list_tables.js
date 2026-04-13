require('dotenv').config({path: '.env.local'})
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)
async function run() {
  const { data, error } = await sb.rpc('get_tables') // Often Supabase doesn't have this RPC by default
  if (error) {
    // Try querying information_schema if possible, though restricted in some Supabase setups
    console.log("Could not use RPC, trying direct query on pg_catalog...")
    const { data: tables, error: tableError } = await sb.from('pg_catalog.pg_tables').select('tablename').eq('schemaname', 'public')
    if (tableError) {
        console.log("Direct query failed, trying to guess some common tables...")
        const common = ['medical_reports', 'prescriptions', 'imaging', 'patient_documents', 'attachments']
        for (const t of common) {
            const { error: e } = await sb.from(t).select('id').limit(1)
            if (!e) console.log(`Table exists: ${t}`)
            else console.log(`Table ${t} does not exist or error: ${e.message}`)
        }
    } else {
        console.log("Tables:", tables.map(t => t.tablename))
    }
  } else {
    console.log("Tables from RPC:", data)
  }
}
run()
