
import { supabase } from "./lib/supabase.js";

async function test() {
  const { data, error } = await supabase.from("prescriptions").select("*").limit(10);
  if (error) {
    console.error(error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

test();
