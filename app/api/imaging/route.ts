import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getAuthSession } from "@/lib/auth"

export async function GET(request: Request) {
    try {
        const session = await getAuthSession()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        let query = supabase.from("imagingstudies").select("*").order("date", { ascending: false })

        const { searchParams } = new URL(request.url)
        const patientId = searchParams.get("patientId") || searchParams.get("patient_id")

        if (session.role === "DOCTOR") {
            if (patientId) {
                // Check if patient has visited the doctor's hospital
                const { data: apt } = await supabase
                    .from("appointments")
                    .select("id")
                    .eq("patient_id", patientId)
                    .eq("hospital_id", session.hospital_id)
                    .limit(1)

                if (apt && apt.length > 0) {
                    // Authorized to see all records for this patient
                    query = query.eq("patient_id", patientId)
                } else {
                    // Fallback to records where doctor name matches
                    query = query.eq("patient_id", patientId).ilike("doctor", session.name.trim())
                }
            } else {
                // General list: filter by doctor name
                query = query.ilike("doctor", session.name.trim())
            }
        } else if (session.role !== "SUPER_ADMIN") {
            // STAFF or other roles might need hospital filtering? 
            // Since imagingstudies lacks hospital_id, we can't filter directly.
            // But if they are looking for a patient, we can allow if that patient is in their hospital.
            if (patientId) {
                query = query.eq("patient_id", patientId)
            }
        } else if (patientId) {
            query = query.eq("patient_id", patientId)
        }

        const { data, error } = await query
        if (error) throw error
        return NextResponse.json(data)
    } catch (error) {
        console.error("Failed to fetch imaging studies:", error)
        return NextResponse.json({ error: "Failed to fetch imaging studies" }, { status: 500 })
    }
}

export async function POST(request: Request) {
    let body: any = null
    try {
        const session = await getAuthSession()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        body = await request.json()
        const dateObj = new Date(body.date || Date.now())
        const imgData = {
            id: body.id || `IMG-${Math.floor(10000 + Math.random() * 90000)}`,
            patient_id: body.patientId || body.patient_id,
            patient_name: body.patientName || body.patient_name,
            study_type: body.studyType || body.study_type,
            body_part: body.bodyPart || body.body_part,
            modality: body.modality,
            date: body.date || dateObj.toISOString().split("T")[0],
            month: body.month || dateObj.toLocaleString("en", { month: "short" }),
            year: body.year || String(dateObj.getFullYear()),
            ai_flag: body.aiFlag || body.ai_flag || "Normal",
            doctor: body.doctor || session.name,
            thumbnail: body.thumbnail || "/placeholder.svg",
            // hospital_id column does not exist in imagingstudies
        }

        const { data, error } = await supabase.from("imagingstudies").insert(imgData).select().single()
        if (error) throw error
        return NextResponse.json(data, { status: 201 })
    } catch (error: any) {
        console.error("Failed to create imaging study. Payload:", body)
        return NextResponse.json({
            error: "Failed to create imaging study",
            details: error.message || "Unknown error"
        }, { status: 500 })
    }
}
