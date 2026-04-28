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

                const { data: docPatients } = await supabase
                    .from("patients")
                    .select("id")
                    .or(`created_by.eq."${session.id}",doctor.ilike."%${doctorName}%"`)

                const docAllowedIds = Array.from(new Set([
                    ...(docApts?.map(a => a.patient_id) || []),
                    ...(docOpds?.map(o => o.uhid_no) || []),
                    ...(docPatients?.map(p => p.id) || [])
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
        // ── 1. RESOLVE DOCTOR & HOSPITAL ─────────────────────────────────────
        let finalDoctorId = session.doctor_id
        const hospitalId = session.hospital_id
        const consultantName = body.doctor || session.name

        if (!finalDoctorId && body.doctor) {
            const { data: doc } = await supabase
                .from("doctors")
                .select("id")
                .eq("name", body.doctor)
                .limit(1)
                .single()
            if (doc) finalDoctorId = doc.id
        }

        const patientData = {
            id: crypto.randomUUID(),
            name: body.name,
            age: body.age,
            gender: body.gender,
            phone: formatPhoneWithPrefix(body.phone),
            diagnosis: body.diagnosis,
            doctor: consultantName,
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

        // --- Create Patient ---
        const { data: patient, error: pError } = await supabase.from("patients").insert(patientData).select().single()
        if (pError) throw pError

        // ── 2. OPD SYNC ──────────────────────────────────────────────────────
        const nowUTC = new Date()
        const istMills = nowUTC.getTime() + (5.5 * 3600000)
        const istDateObj = new Date(istMills)
        const istYear = istDateObj.getUTCFullYear()
        const istMonth = String(istDateObj.getUTCMonth() + 1).padStart(2, '0')
        const istDay = String(istDateObj.getUTCDate()).padStart(2, '0')
        const startOfDay = `${istYear}-${istMonth}-${istDay}T00:00:00.000Z`

        const { count } = await supabase
            .from("opd")
            .select("*", { count: "exact", head: true })
            .gte("created_at", startOfDay)

        const sequenceNum = (count || 0) + 1
        const formattedSeq = sequenceNum.toString().padStart(3, '0')
        const visitCode = `V${Math.floor(1000 + Math.random() * 9000).toString()}`
        const opdNo = `${visitCode}-${formattedSeq}`

        const todayDateStr = `${istYear}-${istMonth}-${istDay}`
        const monthsArr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        const displayDate = `${istDay} ${monthsArr[istDateObj.getUTCMonth()]} ${istYear}`

        // validDate calculation (5 days from today)
        const validDateObj = new Date(istDateObj.getTime() + (5 * 24 * 60 * 60 * 1000))
        const validUpto = `${validDateObj.getUTCDate().toString().padStart(2, '0')} ${monthsArr[validDateObj.getUTCMonth()]} ${validDateObj.getUTCFullYear()}`

        const opdData = {
            uhid_no: patient.id,
            date: displayDate,
            token_no: body.tokenNo || body.token_no || formattedSeq,
            patient_name: patient.name,
            age_sex: `${patient.age} / ${patient.gender}`,
            opd_no: body.opdNo || body.opd_no || opdNo,
            guardian_name: patient.guardian_name || "",
            mobile_no: patient.phone,
            valid_upto: validUpto,
            consultant: consultantName,
            address: patient.address || "Walk-in Patient",
            patient_type: body.patientType || body.patient_type || "Walk-in",
            unique_citizen_card_number: patient.unique_citizen_card_number,
            doctor_id: finalDoctorId,
            hospital_id: hospitalId,
        }

        const { error: oError } = await supabase.from("opd").insert(opdData)
        if (oError) console.error("Error creating OPD record:", oError)

        // ── 3. APPOINTMENT SYNC ──────────────────────────────────────────────
        const apptId = `APT-${Math.floor(10000 + Math.random() * 90000)}`
        const apptData = {
            id: apptId,
            patient_name: patient.name,
            patient_id: patient.id,
            unique_citizen_card_number: patient.unique_citizen_card_number,
            date: todayDateStr,
            time: istDateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
            doctor: consultantName,
            specialty: patient.diagnosis || "General",
            type: "OPD",
            status: "Scheduled",
            phone: patient.phone || null,
            notes: "[Created during Registration]",
            doctor_id: finalDoctorId,
            hospital_id: hospitalId,
        }

        const { error: aError } = await supabase.from("appointments").insert(apptData)
        if (aError) console.error("Error creating appointment:", aError)

        return NextResponse.json(patient, { status: 201 })
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
