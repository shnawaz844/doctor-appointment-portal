import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getAuthSession } from "@/lib/auth"

export async function GET() {
    try {
        const session = await getAuthSession()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        let query = supabase.from("labresults").select("*").order("date", { ascending: false })

        if (session.role !== "SUPER_ADMIN") {
            if (!session.hospital_id) return NextResponse.json({ error: "No hospital assigned" }, { status: 403 })
            query = query.eq("hospital_id", session.hospital_id)
        }

        if (session.role === "DOCTOR") {
            query = query.ilike("doctor", session.name.trim())
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
    try {
        const session = await getAuthSession()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()

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
            hospital_id: session.hospital_id || body.hospital_id,
        }

        const { data, error } = await supabase.from("labresults").insert(labData).select().single()
        if (error) throw error
        return NextResponse.json(data, { status: 201 })
    } catch (error) {
        console.error("Failed to create lab result:", error)
        return NextResponse.json({ error: "Failed to create lab result" }, { status: 500 })
    }
}
