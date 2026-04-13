import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function verify() {
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("type", "Online")
  
  if (error) {
    console.error("Error fetching online appointments:", error.message)
    process.exit(1)
  }
  
  console.log(`Found ${data.length} online appointments.`)
  data.forEach(a => console.log(`- ${a.patient_name} (${a.id})`))
  
  if (data.length === 5) {
    console.log("Verification successful: All 5 dummy appointments present.")
  } else {
    console.warn(`Verification partial: Found ${data.length}/5 appointments.`)
  }
}

verify()
