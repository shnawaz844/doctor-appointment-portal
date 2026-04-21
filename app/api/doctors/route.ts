import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"
import { getAuthSession, hasRole } from "@/lib/auth"

export async function GET(req: Request) {
    try {
        const session = await getAuthSession()
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const status = new URL(req.url).searchParams.get("status")
        let doctorQuery = supabase.from("doctors").select("*").order("name", { ascending: true })

        if (session.role !== "SUPER_ADMIN") {
            if (!session.hospital_id) return NextResponse.json({ error: "No hospital assigned" }, { status: 403 })
            doctorQuery = doctorQuery.eq("hospital_id", session.hospital_id)
        }

        if (status === "inactive") {
            doctorQuery = doctorQuery.eq("is_active", false)
        } else {
            doctorQuery = doctorQuery.eq("is_active", true)
        }

        const [{ data: doctors, error: dErr }, { data: specialties, error: sErr }] = await Promise.all([
            doctorQuery,
            supabase.from("specialties").select("*")
        ])

        if (dErr) throw dErr
        if (sErr) throw sErr

        const combined = doctors.map((d: any) => ({
            ...d,
            specialties: specialties?.find((s: any) => s.id === d.specialty_id)
        }))

        return NextResponse.json(combined)
    } catch (error) {
        console.error("Failed to fetch doctors:", error)
        return NextResponse.json({ error: "Failed to fetch doctors" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await getAuthSession()
        const body = await req.json()
        const { name, specialtyId, specialty_id, phone, email, password, image, fee, emergency_fee } = body

        console.log("Creating doctor:", { name, email, specialty_id: specialtyId || specialty_id, fee, emergency_fee })

        if (!name || !(specialtyId || specialty_id)) {
            return NextResponse.json({ error: "Name and Specialty are required" }, { status: 400 })
        }

        const doctorId = `DOC-${Math.floor(1000 + Math.random() * 9000)}`
        let hospitalId = session?.hospital_id || body.hospital_id

        if (!hospitalId && session?.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Hospital ID is required" }, { status: 400 })
        }

        // Check if doctor record already exists
        if (email) {
            const { data: existingDoc } = await supabase.from("doctors").select("id").eq("email", email).single()
            if (existingDoc) {
                return NextResponse.json({ error: "A doctor with this email already exists in the doctors list" }, { status: 400 })
            }
        }

        // Create or Link User record
        if (email && password) {
            const { data: existingUser, error: userFetchErr } = await supabase.from("users").select("id, role").eq("email", email).single()

            if (existingUser) {
                console.log("User already exists, linking to new doctor record:", existingUser.id)
                // Optionally update role if needed
                if (existingUser.role !== "DOCTOR") {
                    await supabase.from("users").update({ role: "DOCTOR" }).eq("id", existingUser.id)
                }
            } else {
                const hashedPassword = await bcrypt.hash(password, 10)
                const { error: userErr } = await supabase.from("users").insert({
                    name,
                    email,
                    password: hashedPassword,
                    role: "DOCTOR",
                    hospital_id: hospitalId
                })
                if (userErr) {
                    console.error("User creation failed:", userErr)
                    throw userErr
                }
            }
        }

        const { data, error } = await supabase.from("doctors").insert({
            id: doctorId,
            name,
            specialty_id: specialtyId || specialty_id,
            phone,
            email,
            image,
            fee: fee || 0,
            emergency_fee: emergency_fee || 0,
            hospital_id: hospitalId,
            is_active: true
        }).select().single()

        if (error) {
            console.error("Doctor record creation failed:", error)
            // If we created a user but the doctor insert failed, we might want to cleanup...
            // But for now, returning the error is better than silence.
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json(data, { status: 201 })
    } catch (error: any) {
        console.error("Failed to create doctor (generic error):", error)
        return NextResponse.json({ error: error.message || "Failed to create doctor" }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getAuthSession()
        if (!session || !hasRole(session, ["ADMIN", "SUPER_ADMIN"])) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const doctorId = searchParams.get("id")

        if (!doctorId) {
            return NextResponse.json({ error: "Doctor ID is required" }, { status: 400 })
        }

        let deleteQuery = supabase
            .from("doctors")
            .update({ is_active: false })
            .eq("id", doctorId)

        if (session.role !== "SUPER_ADMIN") {
            if (!session.hospital_id) return NextResponse.json({ error: "No hospital assigned" }, { status: 403 })
            deleteQuery = deleteQuery.eq("hospital_id", session.hospital_id)
        }

        const { error } = await deleteQuery
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("Failed to deactivate doctor:", error)
        return NextResponse.json({ error: error.message || "Failed to deactivate doctor" }, { status: 500 })
    }
}
