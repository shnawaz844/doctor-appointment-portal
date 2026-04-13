import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getAuthSession } from "@/lib/auth"

export async function GET(
    request: Request,
    { params }: { params: { uccn: string } }
) {
    try {
        // Optional: auth session check
        // const session = await getAuthSession()
        // if (!session) {
        //     return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        // }

        const { uccn } = await params

        if (!uccn) {
            return NextResponse.json({ error: "UCCN is required" }, { status: 400 })
        }

        // 1. First find the patient_id from the patients table using UCCN
        const { data: patient, error: patientError } = await supabase
            .from("patients")
            .select("id")
            .eq("unique_citizen_card_number", uccn)
            .maybeSingle()

        if (patientError) {
            console.error("Error finding patient by UCCN:", patientError)
        }

        const patientId = patient?.id

        // 2. Fetch imaging studies where citizen_id matches OR patient_id matches
        let query = supabase.from("imagingstudies").select("*")

        if (patientId) {
            query = query.or(`citizen_id.eq.${uccn},patient_id.eq.${patientId}`)
        } else {
            query = query.eq("citizen_id", uccn)
        }

        const { data, error } = await query.order("date", { ascending: false })

        if (error) throw error

        return NextResponse.json(data)
    } catch (error: any) {
        console.error("Failed to fetch imaging studies by UCCN:", error)
        return NextResponse.json({ 
            error: "Failed to fetch imaging studies",
            details: error.message || "Unknown error" 
        }, { status: 500 })
    }
}
