import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

const OPD_API_KEY = process.env.OPD_API_KEY || "doctor-portal-secure-2026"

function validateApiKey(request: Request): boolean {
    const key = request.headers.get("x-api-key")
    return key === OPD_API_KEY
}

/**
 * POST /api/opd-online
 * ─────────────────────────────────────────────────────────────────────────────
 * Public endpoint for online OPD booking from the PGF app.
 * Automatically creates:
 * 1. A Patient record (if not exists)
 * 2. An OPD Registration record
 * 3. An Appointment record
 */
export async function POST(request: Request) {
    try {
        if (!validateApiKey(request)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        console.log("[POST /api/opd-online] Received body:", JSON.stringify(body, null, 2))
        const {
            patientName,
            citizenId, // Unique Citizen Card Number
            phone,
            doctorId,
            date,   // YYYY-MM-DD
            time,   // e.g. "10:00 AM"
            notes,
            age,    // Mandatory for hospital patient record
            gender, // Mandatory for hospital patient record
            address,
            guardianName,
            doctorName, // Name of the doctor selected in the app
            specialty,  // Specialty of the doctor selected in the app
            medicalReports = [], // Array of URLs
            prescriptions = [], // Array of URLs
            imaging = [], // Array of URLs
            appointmentType, // Optional, defaults to "OPD"
            hospitalId,
        } = body

        if (!patientName || !date || !time || !citizenId) {
            return NextResponse.json(
                { error: "patientName, date, time, and citizenId are required." },
                { status: 400 }
            )
        }

        // ── RESOLVE DOCTOR INFO ──────────────────────────────────────────────
        // Use values from the app as defaults, then try to refine with a DB lookup
        let consultantName = doctorName || "General Physician"
        let specialtyName = specialty || "General"

        if (doctorId) {
            const { data: doc } = await supabase
                .from("doctors")
                .select("name, specialty_id")
                .eq("id", doctorId)
                .single()

            if (doc) {
                consultantName = doc.name;
                // If the app didn't send a specialty name, we try to fetch it from the ID
                if (!specialtyName || specialtyName === "General") {
                    const { data: spec } = await supabase
                        .from("specialties")
                        .select("name")
                        .eq("id", doc.specialty_id)
                        .single()
                    if (spec) specialtyName = spec.name
                }
            }
        }

        // 1. ── PATIENT SYNC ──────────────────────────────────────────────────
        let finalUhid = ""

        // Check for existing patient by citizen card ID
        const { data: existingPatientByCC } = await supabase
            .from("patients")
            .select("id, name")
            .eq("unique_citizen_card_number", citizenId)
            .single()

        if (existingPatientByCC) {
            finalUhid = existingPatientByCC.id
        } else {
            // Check by name and phone as fallback
            const { data: existingPatientByName } = await supabase
                .from("patients")
                .select("id")
                .eq("name", patientName)
                .eq("phone", phone)
                .single()

            if (existingPatientByName) {
                finalUhid = existingPatientByName.id
                // Update their citizen card number if missing
                await supabase
                    .from("patients")
                    .update({ unique_citizen_card_number: citizenId })
                    .eq("id", finalUhid)
            } else {
                // Create NEW patient
                finalUhid = `P${Math.floor(1000 + Math.random() * 9000).toString()}`
                const now = new Date()
                const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

                const { error: pError } = await supabase.from("patients").insert({
                    id: finalUhid,
                    name: patientName,
                    age: parseInt(age) || 0,
                    gender: gender || "Others",
                    phone: phone,
                    address: address || "PGF Area",
                    guardian_name: guardianName || "",
                    unique_citizen_card_number: citizenId,
                    diagnosis: "Online OPD Booking",
                    doctor: consultantName,
                    report_type: "OPD",
                    last_visit: date,
                    year: now.getFullYear().toString(),
                    month: months[now.getMonth()],
                })

                if (pError) throw pError
                console.log("[POST /api/opd-online] Created patient:", finalUhid)
            }
        }

        // 2. ── OPD SYNC ──────────────────────────────────────────────────────
        // Force IST (UTC+5:30) today date for server-side token sequence logic
        const nowUTC = new Date()
        const istMills = nowUTC.getTime() + (5.5 * 3600000)
        const istDateObj = new Date(istMills)

        // Start of IST Day in ISO format for DB query
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
        const visitCode = `P${Math.floor(1000 + Math.random() * 9000).toString()}`
        const opdNo = `${visitCode}-${formattedSeq}`

        // Safe date formatter for YYYY-MM-DD input
        const safeFormatDate = (dateStr: string) => {
            const [y, m, d] = dateStr.split('-');
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            return `${d} ${months[parseInt(m) - 1]} ${y}`;
        };

        // validDate calculation for printed slip (5 days from the provided appointment date)
        const [y, m, d] = date.split('-').map(Number);
        // Create date at noon UTC to avoid edge-of-day shifts during calculation
        const apptDateUTC = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
        const validDateUTC = new Date(apptDateUTC.getTime() + (5 * 24 * 60 * 60 * 1000));
        const formatDateForUpto = (d: Date) => d.getUTCDate().toString().padStart(2, '0') + ' ' +
            ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getUTCMonth()] + ' ' +
            d.getUTCFullYear();

        const opdData = {
            uhid_no: finalUhid,
            date: safeFormatDate(date),
            token_no: formattedSeq,
            patient_name: patientName,
            age_sex: `${age || "0"} / ${gender || "Others"}`,
            opd_no: opdNo,
            guardian_name: guardianName || "",
            mobile_no: phone,
            valid_upto: formatDateForUpto(validDateUTC),
            consultant: consultantName,
            address: address || "PGF Area",
            patient_type: "Online Client",
            unique_citizen_card_number: citizenId,
            doctor_id: doctorId,
            hospital_id: hospitalId,
        }

        const { error: oError } = await supabase.from("opd").insert(opdData)
        if (oError) throw oError
        console.log("[POST /api/opd-online] Created OPD record:", opdNo)

        // 3. ── APPOINTMENT SYNC ──────────────────────────────────────────────
        const apptId = `APT-${Math.floor(10000 + Math.random() * 90000)}`
        const apptData = {
            id: apptId,
            patient_name: patientName,
            patient_id: finalUhid,
            unique_citizen_card_number: citizenId,
            date,
            time,
            doctor: consultantName,
            specialty: specialtyName,
            type: appointmentType || "OPD",
            status: "Scheduled",
            phone: phone || null,
            notes: notes ? `${notes}\n\n[Booked From PGF APP]` : "[Booked From PGF APP]",
            doctor_id: doctorId,
            hospital_id: hospitalId,
        }

        const { data: finalAppt, error: aError } = await supabase
            .from("appointments")
            .insert(apptData)
            .select()
            .single()

        if (aError) throw aError
        console.log("[POST /api/opd-online] Created appointment:", finalAppt?.id || apptId)

        // 4. ── PROCESS DOCUMENTS ─────────────────────────────────────────────
        const medicalRecordsToInsert = medicalReports.map((url: string) => ({
            id: `MR-${Math.floor(10000 + Math.random() * 90000)}`,
            patient_name: patientName,
            patient_id: finalUhid,
            record_type: "Progress Notes",
            date: date,
            doctor: consultantName,
            status: "Active",
            summary: "Uploaded via PGF app booking (Medical Report)",
            attachment_url: url,
            attachment_type: url.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg",
            unique_citizen_card_number: citizenId
        }))

        if (medicalRecordsToInsert.length > 0) {
            const { error: mrError } = await supabase.from("medicalrecords").insert(medicalRecordsToInsert)
            if (mrError) console.error("Error inserting medical records:", mrError)
        }

        // Prescriptions (stored in the actual prescriptions table)
        let mainPrescriptionId = null
        if (prescriptions.length > 0) {
            const prescriptionsToInsert = prescriptions.map((url: string) => ({
                id: `RX-${Math.floor(10000 + Math.random() * 90000)}`,
                patient_name: patientName,
                patient_id: finalUhid,
                issued: date,
                status: "Active",
                doctor_name: consultantName,
                doctor_id: doctorId || "PGF-APP",
                instructions: "Uploaded via PGF app booking",
                attachment_url: url,
                attachment_type: url.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg",
                unique_citizen_card_number: citizenId
            }))

            const { data: rxData, error: rxError } = await supabase.from("prescriptions").insert(prescriptionsToInsert).select()
            if (rxError) {
                console.error("Error inserting prescriptions:", rxError)
            } else if (rxData && rxData.length > 0) {
                mainPrescriptionId = rxData[0].id
                // Link the first prescription to the appointment
                await supabase
                    .from("appointments")
                    .update({ prescription_id: mainPrescriptionId })
                    .eq("id", apptId)
            }
        }

        // Imaging Studies
        if (imaging.length > 0) {
            const imagingToInsert = imaging.map((url: string) => ({
                id: `IMG-${Math.floor(10000 + Math.random() * 90000)}`,
                patient_id: finalUhid,
                patient_name: patientName,
                study_type: "X-ray",
                body_part: "Various",
                modality: "Other",
                date: date,
                month: new Date(date).toLocaleString('default', { month: 'short' }),
                year: new Date(date).getFullYear().toString(),
                ai_flag: "Normal",
                doctor: consultantName,
                thumbnail: url,
                unique_citizen_card_number: citizenId
            }))
            const { error: imgError } = await supabase.from("imagingstudies").insert(imagingToInsert)
            if (imgError) console.error("Error inserting imaging studies:", imgError)
        }

        return NextResponse.json({
            success: true,
            uhid: finalUhid,
            opdNo: opdNo,
            appointment: finalAppt,
        }, { status: 201 })

    } catch (error: any) {
        console.error("[POST /api/opd-online] Error:", error)
        return NextResponse.json(
            {
                error: "Booking Failed",
                message: error?.message || "Internal Server Error",
                details: error?.details || error?.hint || "Database constraint violation"
            },
            { status: 500 }
        )
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const citizenId = searchParams.get("citizenId") || searchParams.get("citizen_id")

        if (!citizenId) return NextResponse.json({ error: "Missing citizenId" }, { status: 400 })

        const { data, error } = await supabase
            .from("appointments")
            .select("*")
            .eq("unique_citizen_card_number", citizenId)
            .eq("type", "Online Consultation")
            .order("created_at", { ascending: false })

        if (error) throw error
        return NextResponse.json({ appointments: data || [] })
    } catch (error: any) {
        return NextResponse.json({ error: "Fetch Failed" }, { status: 500 })
    }
}
