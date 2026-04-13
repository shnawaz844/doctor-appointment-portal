import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
    try {
        const { data, error } = await supabase.from("reports").select("*").order("date", { ascending: false })
        if (error) throw error
        return NextResponse.json(data)
    } catch (error) {
        console.error("Failed to fetch reports:", error)
        return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const reportData = {
            id: body.id || `R-${Math.floor(10000 + Math.random() * 90000)}`,
            patient_id: body.patientId || body.patient_id,
            type: body.type,
            name: body.name,
            date: body.date,
            path: body.path,
        }
        const { data, error } = await supabase.from("reports").insert(reportData).select().single()
        if (error) throw error
        return NextResponse.json(data, { status: 201 })
    } catch (error) {
        console.error("Failed to create report:", error)
        return NextResponse.json({ error: "Failed to create report" }, { status: 500 })
    }
}
