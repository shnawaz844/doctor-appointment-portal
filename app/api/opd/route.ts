import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getAuthSession } from "@/lib/auth"
import { formatPhoneWithPrefix } from "@/lib/phone"

export async function GET(request: Request) {
    try {
        const session = await getAuthSession()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const dateFilter = searchParams.get("date") // e.g. "26 Mar 2026"

        let query = supabase.from("opd").select("*").order("created_at", { ascending: false })

        if (session.role !== "SUPER_ADMIN") {
            if (!session.hospital_id) return NextResponse.json({ error: "No hospital assigned" }, { status: 403 })
            query = query.eq("hospital_id", session.hospital_id)
        }

        // Filter by consultant name or doctor ID if the user is a doctor
        if (session.role === "DOCTOR") {
            if (session.doctor_id) {
                query = query.or(`doctor_id.eq."${session.doctor_id}",consultant.eq."${session.name}"`)
            } else {
                query = query.eq("consultant", session.name)
            }
        }

        if (dateFilter) {
            // Flexible filtering: match both "01 Apr 2026" and older "01/Apr/2026" formats
            const alternateFilter = dateFilter.replace(/ /g, '/')
            query = query.or(`date.eq."${dateFilter}",date.eq."${alternateFilter}"`)
        }

        const { data, error } = await query
        if (error) throw error
        return NextResponse.json(data)
    } catch (error) {
        console.error("Failed to fetch OPD registrations:", error)
        return NextResponse.json({ error: "Failed to fetch OPD registrations" }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const session = await getAuthSession()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const opdData: any = {
            id: body.id || `OPD-${Math.floor(100000 + Math.random() * 900000)}`,
            uhid_no: body.uhidNo || body.uhid_no,
            date: body.date,
            token_no: body.tokenNo || body.token_no,
            patient_name: body.patientName || body.patient_name,
            age_sex: body.age && body.sex ? `${body.age} / ${body.sex}` : (body.ageSex || body.age_sex),
            opd_no: body.opdNo || body.opd_no,
            guardian_name: body.guardianName || body.guardian_name,
            mobile_no: formatPhoneWithPrefix(body.mobileNo || body.mobile_no),
            valid_upto: body.validUpto || body.valid_upto,
            consultant: body.consultant,
            address: body.address,
            patient_type: body.patientType || body.patient_type,
            unique_citizen_card_number: body.uniqueCitizenCardNumber || body.unique_citizen_card_number,
            created_by: session.id,
            hospital_id: session.hospital_id || body.hospital_id,
            doctor_id: body.doctor_id || body.doctorId,
        }

        if (opdData.doctor_id) {
            let doctorQuery = supabase
                .from("doctors")
                .select("id, is_active, hospital_id")
                .eq("id", opdData.doctor_id)
                .single()

            if (session.role !== "SUPER_ADMIN") {
                if (!session.hospital_id) return NextResponse.json({ error: "No hospital assigned" }, { status: 403 })
                doctorQuery = doctorQuery.eq("hospital_id", session.hospital_id)
            }

            const { data: doctorData, error: doctorError } = await doctorQuery
            if (doctorError || !doctorData) {
                return NextResponse.json({ error: "Selected doctor not found" }, { status: 400 })
            }

            if (doctorData.is_active === false) {
                return NextResponse.json({ error: "Selected doctor is inactive and cannot be booked" }, { status: 400 })
            }
        }

        const { data, error } = await supabase.from("opd").insert(opdData).select().single()
        if (error) throw error
        return NextResponse.json(data, { status: 201 })
    } catch (error: any) {
        console.error("Failed to create OPD registration:", error)
        return NextResponse.json({ 
            error: "Failed to create OPD registration",
            message: error.message || "Unknown database error",
            details: error.details || error.hint
        }, { status: 500 })
    }
}
