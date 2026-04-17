import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getAuthSession, hasRole } from "@/lib/auth"
import { formatPhoneWithPrefix } from "@/lib/phone"

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

        // If not super admin with no hospital, we need to filter patients by their interactions
        if (!(session.role === "SUPER_ADMIN" && !session.hospital_id)) {
            const hospitalId = session.hospital_id
            if (!hospitalId) {
                return NextResponse.json({ error: "User is not assigned to any hospital" }, { status: 403 })
            }

            // 1. Fetch patient IDs from appointments for this hospital
            const { data: aptPatients } = await supabase
                .from("appointments")
                .select("patient_id")
                .eq("hospital_id", hospitalId)

            // 2. Fetch patient IDs from opd for this hospital
            const { data: opdPatients } = await supabase
                .from("opd")
                .select("uhid_no")
                .eq("hospital_id", hospitalId)

            const allowedIds = Array.from(new Set([
                ...(aptPatients?.map(a => a.patient_id) || []),
                ...(opdPatients?.map(o => o.uhid_no) || [])
            ])).filter(Boolean)

            // If a doctor is logged in and not fetching all, further filter by their name/id
            if (session.role === "DOCTOR" && !fetchAll) {
                const doctorName = session.name.trim()
                const doctorId = session.doctor_id

                // Further refine allowed IDs by checking doctor association in appointments/opd
                const { data: docApts } = await supabase
                    .from("appointments")
                    .select("patient_id")
                    .eq("hospital_id", hospitalId)
                    .or(`doctor_id.eq."${doctorId}",doctor.ilike.%${doctorName}%`)

                const { data: docOpds } = await supabase
                    .from("opd")
                    .select("uhid_no")
                    .eq("hospital_id", hospitalId)
                    .or(`doctor_id.eq."${doctorId}",consultant.ilike.%${doctorName}%`)

                const docAllowedIds = Array.from(new Set([
                    ...(docApts?.map(a => a.patient_id) || []),
                    ...(docOpds?.map(o => o.uhid_no) || [])
                ])).filter(Boolean)

                query = query.in("id", docAllowedIds)
            } else {
                query = query.in("id", allowedIds)
            }
        }

        if (cardNo) {
            query = query.eq("unique_citizen_card_number", cardNo)
        }

        const { data: patients, error: pError } = await query
        if (pError) throw pError

        // For each patient, fetch their OPD records to calculate last visit
        // We filter by consultant to match the requirement "opd with current doctor"
        // and we sort by created_at desc to find previous visits correctly.

        const patientSummaries = await Promise.all((patients || []).map(async (patient) => {
            // Fetch latest appointment to get doctor name (especially for mobile app bookings)
            const { data: appts } = await supabase
                .from("appointments")
                .select("doctor")
                .eq("patient_id", patient.id)
                .order("created_at", { ascending: false })
                .limit(1)

            const resolvedDoctor = appts && appts.length > 0 ? appts[0].doctor : (patient.doctor || "N/A")

            const { data: opdRecords } = await supabase
                .from("opd")
                .select("date, created_at")
                .eq("uhid_no", patient.id)
                .ilike("consultant", resolvedDoctor.trim())
                .order("created_at", { ascending: false })

            let lastVisitText = "1st visit"

            if (opdRecords && opdRecords.length > 1) {
                // The most recent record (index 0) is the current visit
                // The previous record (index 1) is the "Last Visit"
                lastVisitText = opdRecords[1].date
            }

            return {
                ...patient,
                doctor: resolvedDoctor,
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
            phone: formatPhoneWithPrefix(body.phone),
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
    } catch (error: any) {
        console.error("Failed to create patient:", error)
        return NextResponse.json({
            error: "Failed to create patient",
            message: error.message || "Unknown database error",
            details: error.details || error.hint
        }, { status: 500 })
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
