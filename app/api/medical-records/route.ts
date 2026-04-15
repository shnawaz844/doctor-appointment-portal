import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getAuthSession } from "@/lib/auth"

export async function GET() {
    try {
        const session = await getAuthSession()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        let query = supabase.from("medicalrecords").select("*").order("created_at", { ascending: false })

        // Hospital filtering skipped for medicalrecords as the column does not exist
        // if (session.role !== "SUPER_ADMIN") {
        //     if (!session.hospital_id) return NextResponse.json({ error: "No hospital assigned" }, { status: 403 })
        //     query = query.eq("hospital_id", session.hospital_id)
        // }

        if (session.role === "DOCTOR") {
            query = query.ilike("doctor", session.name.trim())
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
    try {
        const session = await getAuthSession()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
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
