require('dotenv').config({path: '.env.local'})
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

async function checkColumns() {
  const tables = ['medicalrecords', 'imagingstudies', 'prescriptions']
  for (const table of tables) {
    try {
      // Try to fetch one row or just check schema if possible
      // Since it's Postgres, we can query information_schema
      const { data, error } = await sb.rpc('check_columns', { table_name: table })
      // If RPC is not available, we can just try a select and check the error/data
      const { data: cols, error: err } = await sb.from(table).select('*').limit(0)
      if (err) {
         console.error(`Error checking ${table}:`, err.message)
      } else {
         console.log(`Checking ${table} via select * limit 0: SUCCESS`)
      }
    } catch (e) {
      console.error(e)
    }
  }
}

// A better way is to attempt an insert with the column and see if it works
async function testInsert() {
    const citizenId = 'TEST_UCCN_123'
    
    console.log('Testing medicalrecords...')
    const { error: err1 } = await sb.from('medicalrecords').insert({
        id: 'TEST-' + Date.now(),
        patient_id: 'TEST-PATIENT',
        patient_name: 'TEST PATIENT',
        record_type: 'Other',
        date: '2026-04-01',
        doctor: 'TEST DOCTOR',
        status: 'Active',
        unique_citizen_card_number: citizenId
    })
    if (err1) console.log('medicalrecords error:', err1.message)
    else console.log('medicalrecords check: unique_citizen_card_number EXISTS')

    console.log('Testing imagingstudies...')
    const { error: err2 } = await sb.from('imagingstudies').insert({
        id: 'TEST-IMG-' + Date.now(),
        patient_id: 'TEST-PATIENT',
        patient_name: 'TEST PATIENT',
        study_type: 'X-ray',
        body_part: 'Other',
        modality: 'Other',
        date: '2026-04-01',
        month: 'Apr',
        year: '2026',
        doctor: 'TEST DOCTOR',
        unique_citizen_card_number: citizenId
    })
    if (err2) console.log('imagingstudies error:', err2.message)
    else console.log('imagingstudies check: unique_citizen_card_number EXISTS')
    
    console.log('Testing prescriptions...')
    const { error: err3 } = await sb.from('prescriptions').insert({
        id: 'TEST-PRE-' + Date.now(),
        patientId: 'TEST-PATIENT',
        patientName: 'TEST PATIENT',
        issued: '2026-04-01',
        doctorName: 'TEST DOCTOR',
        doctorId: 'TEST-DOC',
        status: 'Active',
        unique_citizen_card_number: citizenId
    })
    if (err3) console.log('prescriptions error:', err3.message)
    else console.log('prescriptions check: unique_citizen_card_number EXISTS')
}

testInsert()
