import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getAuthSession } from "@/lib/auth"

export async function GET() {
    try {
        const session = await getAuthSession()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        let query = supabase.from("imagingstudies").select("*").order("date", { ascending: false })

        if (session.role === "SUPER_ADMIN") {
            if (session.hospital_id) {
                query = query.eq("hospital_id", session.hospital_id)
            }
        } else {
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
        console.error("Failed to fetch imaging studies:", error)
        return NextResponse.json({ error: "Failed to fetch imaging studies" }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const session = await getAuthSession()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
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
            ai_flag: body.aiFlag || body.ai_flag,
            doctor: body.doctor || session.name,
            thumbnail: body.thumbnail || "/placeholder.svg",
            hospital_id: session.hospital_id || body.hospital_id,
        }

        const { data, error } = await supabase.from("imagingstudies").insert(imgData).select().single()
        if (error) throw error
        return NextResponse.json(data, { status: 201 })
    } catch (error: any) {
        console.error("Failed to create imaging study:", error)
        return NextResponse.json({
            error: "Failed to create imaging study",
            details: error.message || "Unknown error"
        }, { status: 500 })
    }
}
