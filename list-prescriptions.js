
import { supabase } from "./lib/supabase.js";

async function test() {
  const { data, error } = await supabase.from("prescriptions").select("patient_name, patient_id, medications, issued");
  if (error) {
    console.error(error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

test();
