import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"

export async function GET() {
    try {
        const [{ data: doctors, error: dErr }, { data: specialties, error: sErr }] = await Promise.all([
            supabase.from("doctors").select("*").order("name", { ascending: true }),
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
        const body = await req.json()
        const { name, specialtyId, specialty_id, phone, email, password, image } = body

        if (!name || !(specialtyId || specialty_id)) {
            return NextResponse.json({ error: "Name and Specialty are required" }, { status: 400 })
        }

        const doctorId = `DOC-${Math.floor(1000 + Math.random() * 9000)}`

        // Create User record if email+password provided
        if (email && password) {
            const { data: existing } = await supabase.from("users").select("id").eq("email", email).single()
            if (existing) {
                return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 })
            }
            const hashedPassword = await bcrypt.hash(password, 10)
            const { error: userErr } = await supabase.from("users").insert({
                name, email, password: hashedPassword, role: "DOCTOR"
            })
            if (userErr) throw userErr
        }

        const { data, error } = await supabase.from("doctors").insert({
            id: doctorId,
            name,
            specialty_id: specialtyId || specialty_id,
            phone,
            email,
            image,
        }).select().single()

        if (error) throw error
        return NextResponse.json(data, { status: 201 })
    } catch (error) {
        console.error("Failed to create doctor:", error)
        return NextResponse.json({ error: "Failed to create doctor" }, { status: 500 })
    }
}
