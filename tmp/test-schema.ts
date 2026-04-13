import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

const tables = [
    "patients", "appointments", "doctors", "users", "lab_results",
    "prescriptions", "medical_records", "imaging_studies",
    "diagnoses", "reports", "invoices", "opd", "specialties", "search_results"
]

async function test() {
    for (const table of tables) {
        const { data, error } = await supabase.from(table).select("*").limit(1)
        if (error) {
            console.log(`❌ Table ${table}: ${error.message}`)
        } else {
            console.log(`✅ Table ${table}: Success`)
        }
    }
}

test()
