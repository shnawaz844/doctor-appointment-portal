
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const env = Object.fromEntries(
  envContent
    .split("\n")
    .filter((line) => line.includes("=") && !line.startsWith("#"))
    .map((line) => {
      const parts = line.split("=");
      return [parts[0].trim(), parts.slice(1).join("=").trim().replace(/^["'](.+)["']$/, '$1')];
    })
);

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from("prescriptions").select("patient_name, patient_id, medications, issued");
  if (error) {
    console.error(error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

test();
