import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getAuthSession } from "@/lib/auth"
import { formatPhoneWithPrefix } from "@/lib/phone"

export async function GET() {
    try {
        const session = await getAuthSession()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        let query = supabase.from("appointments").select("*, patients!patient_id(*)").order("created_at", { ascending: false })

        if (session.role === "SUPER_ADMIN") {
            if (session.hospital_id) {
                query = query.eq("hospital_id", session.hospital_id)
            }
        } else {
            if (!session.hospital_id) return NextResponse.json({ error: "No hospital assigned" }, { status: 403 })
            query = query.eq("hospital_id", session.hospital_id)
        }

        if (session.role === "DOCTOR") {
            if (session.doctor_id) {
                query = query.or(`doctor_id.eq."${session.doctor_id}",doctor.ilike.%${session.name.trim()}%`)
            } else {
                query = query.ilike("doctor", session.name.trim())
            }
        }

        const { data, error } = await query
        if (error) throw error
        return NextResponse.json(data)
    } catch (error: any) {
        console.error("Failed to fetch appointments:", error)
        return NextResponse.json({ 
            error: "Failed to fetch appointments",
            message: error.message || "Unknown error",
            details: error.details || error.hint || null
        }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const session = await getAuthSession()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const apptData = {
            id: body.id || `APT-${Math.floor(10000 + Math.random() * 90000)}`,
            patient_name: body.patientName || body.patient_name,
            patient_id: body.patientId || body.patient_id,
            date: body.date,
            time: body.time,
            doctor: body.doctor,
            specialty: body.specialty || "General",
            type: body.type,
            status: body.status || "Scheduled",
            phone: formatPhoneWithPrefix(body.phone),
            unique_citizen_card_number: body.uniqueCitizenCardNumber || body.unique_citizen_card_number,
            notes: body.notes,
            hospital_id: session.hospital_id || body.hospital_id,
            doctor_id: body.doctor_id || body.doctorId,
        }

        const { data, error } = await supabase.from("appointments").insert(apptData).select().single()
        if (error) throw error
        return NextResponse.json(data, { status: 201 })
    } catch (error: any) {
        console.error("Failed to create appointment:", error)
        return NextResponse.json({ 
            error: "Failed to create appointment",
            message: error.message || "Unknown database error",
            details: error.details || error.hint
        }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const { id, _id } = body
        const recordId = id || _id
        if (!recordId) {
            return NextResponse.json({ error: "Missing appointment ID" }, { status: 400 })
        }

        const updateData: any = {
            updated_at: new Date().toISOString()
        }

        if (body.patientName || body.patient_name) updateData.patient_name = body.patientName || body.patient_name
        if (body.patientId || body.patient_id) updateData.patient_id = body.patientId || body.patient_id
        if (body.date) updateData.date = body.date
        if (body.time) updateData.time = body.time
        if (body.doctor) updateData.doctor = body.doctor
        if (body.specialty) updateData.specialty = body.specialty
        if (body.type) updateData.type = body.type
        if (body.status) updateData.status = body.status
        if (body.phone) updateData.phone = formatPhoneWithPrefix(body.phone)
        if (body.uniqueCitizenCardNumber || body.unique_citizen_card_number) updateData.unique_citizen_card_number = body.uniqueCitizenCardNumber || body.unique_citizen_card_number
        if (body.notes !== undefined) updateData.notes = body.notes

        const { data, error } = await supabase
            .from("appointments")
            .update(updateData)
            .eq("id", recordId)
            .select()
            .single()

        if (error) throw error
        if (!data) return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
        return NextResponse.json(data)
    } catch (error) {
        console.error("Failed to update appointment:", error)
        return NextResponse.json({ error: "Failed to update appointment" }, { status: 500 })
    }
}
