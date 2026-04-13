const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const { data: doctors } = await supabase.from('doctors').select('*, specialties(name)');
  console.log('Doctors:', JSON.stringify(doctors, null, 2));

  const { data: patients } = await supabase.from('patients').select('id, name, doctor').limit(5);
  console.log('Patients:', JSON.stringify(patients, null, 2));
}

checkData();
