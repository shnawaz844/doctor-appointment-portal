import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getAuthSession } from "@/lib/auth"

export async function GET(request: Request) {
    try {
        const session = await getAuthSession()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        let query = supabase.from("medicalrecords").select("*").order("created_at", { ascending: false })

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
        } else if (patientId) {
            query = query.eq("patient_id", patientId)
        }

        const { data, error } = await query
        if (error) throw error
        return NextResponse.json(data)
    } catch (error) {
        console.error("Failed to fetch medical records:", error)
        return NextResponse.json({ error: "Failed to fetch medical records" }, { status: 500 })
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
        const mrData = {
            id: body.id || `MR-${Math.floor(10000 + Math.random() * 90000)}`,
            patient_name: body.patientName || body.patient_name,
            patient_id: body.patientId || body.patient_id,
            record_type: body.recordType || body.record_type,
            date: body.date || new Date().toISOString().split("T")[0],
            doctor: body.doctor || session.name,
            status: body.status || "Active",
            summary: body.summary || "",
            attachment_url: body.attachment_url || body.attachmentUrl,
            attachment_type: body.attachment_type || body.attachmentType,
            unique_citizen_card_number: body.unique_citizen_card_number || body.citizenId,
        }

        const { data, error } = await supabase.from("medicalrecords").insert(mrData).select().single()
        if (error) {
            console.error("Supabase insert error details:", error)
            throw error
        }
        return NextResponse.json(data, { status: 201 })
    } catch (error: any) {
        console.error("Failed to create medical record. Payload:", body)
        console.error("Error details:", error)
        return NextResponse.json({
            error: "Failed to create medical record",
            message: error.message || "Unknown error",
            details: error
        }, { status: 500 })
    }
}
