import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getAuthSession } from "@/lib/auth"

export async function GET(request: Request) {
    try {
        const session = await getAuthSession()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        let query = supabase.from("labresults").select("*").order("date", { ascending: false })

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
                    // Authorized to see all lab results for this patient
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
            // STAFF or other roles
            // Since labresults lacks hospital_id, we can't filter directly.
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
        console.error("Failed to fetch lab results:", error)
        return NextResponse.json({ error: "Failed to fetch lab results" }, { status: 500 })
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

        if (!body.id) {
            const { count } = await supabase.from("labresults").select("*", { count: "exact", head: true })
            body.id = `LAB${String((count || 0) + 1).padStart(3, "0")}`
        }
        if (!body.date) {
            body.date = new Date().toISOString().split("T")[0]
        }

        const labData = {
            id: body.id,
            patient_name: body.patientName || body.patient_name,
            patient_id: body.patientId || body.patient_id,
            doctor: body.doctor || session.name,
            test_name: body.testName || body.test_name,
            test_type: body.testType || body.test_type,
            date: body.date,
            status: body.status || "Pending",
            result: body.result || "Awaiting",
            interpretation: body.interpretation,
            values: body.values || [],
            attachment_url: body.attachment_url || body.attachmentUrl,
            attachment_type: body.attachment_type || body.attachmentType,
            // hospital_id column does not exist in labresults table
        }

        const { data, error } = await supabase.from("labresults").insert(labData).select().single()
        if (error) throw error
        return NextResponse.json(data, { status: 201 })
    } catch (error: any) {
        console.error("Failed to create lab result. Payload:", body)
        return NextResponse.json({ 
            error: "Failed to create lab result",
            details: error.message || "Unknown error" 
        }, { status: 500 })
    }
}
