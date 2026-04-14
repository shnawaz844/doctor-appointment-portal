import { supabase } from "@/lib/supabase"
import { getAuthSession } from "@/lib/auth"

export async function GET() {
    try {
        const session = await getAuthSession()
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        let query = supabase.from("reports").select("*").order("date", { ascending: false })

        if (session.role !== "SUPER_ADMIN") {
            if (!session.hospital_id) return NextResponse.json({ error: "No hospital assigned" }, { status: 403 })
            query = query.eq("hospital_id", session.hospital_id)
        }

        const { data, error } = await query
        if (error) throw error
        return NextResponse.json(data)
    } catch (error) {
        console.error("Failed to fetch reports:", error)
        return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const session = await getAuthSession()
        const body = await request.json()
        const reportData = {
            id: body.id || `R-${Math.floor(10000 + Math.random() * 90000)}`,
            patient_id: body.patientId || body.patient_id,
            type: body.type,
            name: body.name,
            date: body.date,
            path: body.path,
            hospital_id: session?.hospital_id || body.hospital_id,
        }
        const { data, error } = await supabase.from("reports").insert(reportData).select().single()
        if (error) throw error
        return NextResponse.json(data, { status: 201 })
    } catch (error) {
        console.error("Failed to create report:", error)
        return NextResponse.json({ error: "Failed to create report" }, { status: 500 })
    }
}
