import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getAuthSession } from "@/lib/auth"

export async function GET(request: Request) {
    try {
        const session = await getAuthSession()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const patientId = searchParams.get("patientId")

        let query = supabase.from("prescriptions").select("*").order("created_at", { ascending: false })

        if (patientId) {
            query = query.eq("patient_id", patientId)
        }

        if (session.role === "DOCTOR") {
            query = query.ilike("doctor_name", session.name.trim())
        }

        const { data, error } = await query
        if (error) throw error
        return NextResponse.json(data)
    } catch (error) {
        console.error("Failed to fetch prescriptions:", error)
        return NextResponse.json({ error: "Failed to fetch prescriptions" }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const session = await getAuthSession()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { appointmentId } = body
        const rxData = {
            id: body.id || `RX-${Math.floor(10000 + Math.random() * 90000)}`,
            patient_name: body.patientName || body.patient_name,
            patient_id: body.patientId || body.patient_id,
            medications: body.medications || [],
            issued: body.issued || new Date().toISOString().split("T")[0],
            status: body.status || "Active",
            doctor_name: body.doctorName || body.doctor_name || session.name,
            doctor_id: body.doctorId || body.doctor_id || session.id,
            instructions: body.instructions,
            duration: body.duration,
        }

        const { data, error } = await supabase.from("prescriptions").insert(rxData).select().single()
        if (error) throw error

        if (appointmentId) {
            const { error: updateError } = await supabase
                .from("appointments")
                .update({ prescription_id: data.id })
                .eq("id", appointmentId)
            
            if (updateError) {
                console.error("Failed to link prescription to appointment:", updateError)
            }
        }

        return NextResponse.json(data, { status: 201 })
    } catch (error) {
        console.error("Failed to create prescription:", error)
        return NextResponse.json({ error: "Failed to create prescription" }, { status: 500 })
    }
}
