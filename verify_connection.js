require('dotenv').config({path: '.env.local'})
const { createClient } = require('@supabase/supabase-js')

async function verify() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY

  console.log(`Checking connection to: ${supabaseUrl}`)
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing Supabase URL or Key in .env.local')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  const tables = [
    { name: 'appointments', pk: 'id' },
    { name: 'diagnoses', pk: 'id' },
    { name: 'doctors', pk: 'id' },
    { name: 'imagingstudies', pk: 'id' },
    { name: 'invoices', pk: 'invoice_id' }, // Correct PK for invoices
    { name: 'labresults', pk: 'id' },
    { name: 'medicalrecords', pk: 'id' },
    { name: 'opd', pk: 'id' },
    { name: 'patients', pk: 'id' },
    { name: 'prescriptions', pk: 'id' },
    { name: 'reports', pk: 'id' },
    { name: 'specialties', pk: 'id' },
    { name: 'users', pk: 'id' }
  ]

  console.log('Verifying all 13 tables...')
  
  let successCount = 0
  let failCount = 0

  for (const table of tables) {
    const { error } = await supabase.from(table.name).select(table.pk).limit(1).maybeSingle()
    if (error) {
      console.log(`❌ ${table.name.padEnd(15)}: ${error.message}`)
      failCount++
    } else {
      console.log(`✅ ${table.name.padEnd(15)}: Found and Connected`)
      successCount++
    }
  }

  console.log('\n--- Summary ---')
  console.log(`Total Tables Found: ${successCount} / ${tables.length}`)
  
  if (successCount === tables.length) {
    console.log('🎉 Full Connection Successful! All 13 tables are present and connected.')
  } else {
    console.log('⚠️ Warning: Some tables could not be verified.')
  }
}

verify()
