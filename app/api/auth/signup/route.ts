import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { supabase } from "@/lib/supabase"
import { getAuthSession } from "@/lib/auth"

export async function POST(req: Request) {
    try {
        const session = await getAuthSession()
        if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
            return NextResponse.json({ error: "Unauthorized. Only administrators can create users." }, { status: 403 })
        }

        const { name, email, password, role, hospital_id } = await req.json()
        const targetHospitalId = hospital_id || session.hospital_id

        if (!name || !email || !password) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const { data: existing } = await supabase
            .from("users")
            .select("id")
            .eq("email", email.toLowerCase().trim())
            .single()

        if (existing) {
            return NextResponse.json({ error: "User already exists" }, { status: 400 })
        }

        const hashedPassword = await bcrypt.hash(password, 12)

        const { data: user, error } = await supabase
            .from("users")
            .insert({
                name,
                email: email.toLowerCase().trim(),
                password: hashedPassword,
                role: role || "STAFF",
                hospital_id: targetHospitalId
            })
            .select("id, name, email, role, hospital_id")
            .single()

        if (error) throw error

        // If user is a Doctor, create a Doctor record
        if (user.role === "DOCTOR") {
            const doctorId = `DOC-${Math.floor(1000 + Math.random() * 9000)}`
            await supabase.from("doctors").insert({
                id: doctorId,
                name: user.name,
                email: user.email,
                specialty_id: "General",
                hospital_id: user.hospital_id
            })
        }

        return NextResponse.json(
            { message: "User created successfully", user: { id: user.id, name: user.name, email: user.email, role: user.role } },
            { status: 201 }
        )
    } catch (error: any) {
        console.error("Signup error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
