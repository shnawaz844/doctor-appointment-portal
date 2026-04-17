import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getAuthSession } from "@/lib/auth"

export async function GET(
    request: Request,
    { params }: { params: { uccn: string } }
) {
    try {
        // Secure auth check
        const session = await getAuthSession()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

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

        // 2. Authorization check for doctors
        let authorized = true
        if (session.role === "DOCTOR") {
            const checkId = patientId || uccn
            const { data: apt } = await supabase
                .from("appointments")
                .select("id")
                .or(`patient_id.eq.${checkId},unique_citizen_card_number.eq.${uccn}`)
                .eq("hospital_id", session.hospital_id)
                .limit(1)
            
            if (!apt || apt.length === 0) {
                authorized = false
            }
        }

        // 3. Fetch prescriptions
        let query = supabase.from("prescriptions").select("*")

        if (patientId) {
            query = query.or(`citizen_id.eq.${uccn},patient_id.eq.${patientId}`)
        } else {
            query = query.eq("citizen_id", uccn)
        }

        if (!authorized && session.role === "DOCTOR") {
            // If not authorized by appointment, only show where they are the prescribing doctor
            query = query.ilike("doctor_name", session.name.trim())
        }

        const { data, error } = await query.order("created_at", { ascending: false })

        if (error) throw error

        return NextResponse.json(data)
    } catch (error: any) {
        console.error("Failed to fetch prescriptions by UCCN:", error)
        return NextResponse.json({ 
            error: "Failed to fetch prescriptions",
            details: error.message || "Unknown error" 
        }, { status: 500 })
    }
}
