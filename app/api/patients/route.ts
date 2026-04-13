import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getAuthSession, hasRole } from "@/lib/auth"

export async function GET(request: Request) {
    try {
        const session = await getAuthSession()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const fetchAll = searchParams.get("all") === "true"
        const cardNo = searchParams.get("unique_citizen_card_number")

        let query = supabase.from("patients").select("*").order("created_at", { ascending: false })

        if (cardNo) {
            query = query.eq("unique_citizen_card_number", cardNo)
        } else if (session.role === "DOCTOR" && !fetchAll) {
            query = query.ilike("doctor", session.name.trim())
        }

        const { data: patients, error: pError } = await query
        if (pError) throw pError

        // For each patient, fetch their OPD records to calculate last visit
        // We filter by consultant to match the requirement "opd with current doctor"
        // and we sort by created_at desc to find previous visits correctly.
        
        const patientSummaries = await Promise.all((patients || []).map(async (patient) => {
            const { data: opdRecords } = await supabase
                .from("opd")
                .select("date, created_at")
                .eq("uhid_no", patient.id)
                .ilike("consultant", (patient.doctor || "").trim())
                .order("created_at", { ascending: false })

            let lastVisitText = "1st visit"
            
            if (opdRecords && opdRecords.length > 1) {
                // The most recent record (index 0) is the current visit
                // The previous record (index 1) is the "Last Visit"
                lastVisitText = opdRecords[1].date
            }

            return {
                ...patient,
                lastVisit: lastVisitText, // Add camelCase for frontend
                last_visit: lastVisitText  // Keep snake_case for consistency
            }
        }))

        return NextResponse.json(patientSummaries)
    } catch (error) {
        console.error("Failed to fetch patients:", error)
        return NextResponse.json({ error: "Failed to fetch patients" }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const session = await getAuthSession()
        const body = await request.json()
        if (!session || !hasRole(session, ["ADMIN", "STAFF", "DOCTOR"])) {
            return NextResponse.json({ error: "Forbidden: Only Admin, Staff or Doctor can create patients" }, { status: 403 })
        }
        const patientData = {
            id: body.id,
            name: body.name,
            age: body.age,
            gender: body.gender,
            phone: body.phone,
            diagnosis: body.diagnosis,
            doctor: body.doctor,
            last_visit: body.lastVisit || body.last_visit,
            report_type: body.reportType || body.report_type,
            report_url: body.reportUrl || body.report_url,
            year: body.year,
            month: body.month,
            laterality: body.laterality,
            severity: body.severity,
            injury_date: body.injuryDate || body.injury_date,
            surgery_required: body.surgeryRequired ?? body.surgery_required,
            physical_therapy: body.physicalTherapy ?? body.physical_therapy,
            address: body.address,
            guardian_name: body.guardianName || body.guardian_name,
            unique_citizen_card_number: body.uniqueCitizenCardNumber || body.unique_citizen_card_number,
            created_by: session.id,
        }

        const { data, error } = await supabase.from("patients").insert(patientData).select().single()
        if (error) throw error
        return NextResponse.json(data, { status: 201 })
    } catch (error) {
        console.error("Failed to create patient:", error)
        return NextResponse.json({ error: "Failed to create patient" }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getAuthSession()
        if (!session || !hasRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")
        if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

        const { error } = await supabase.from("patients").delete().eq("id", id)
        if (error) throw error
        return NextResponse.json({ message: "Patient deleted" })
    } catch (error) {
        console.error("Failed to delete patient:", error)
        return NextResponse.json({ error: "Failed to delete patient" }, { status: 500 })
    }
}
