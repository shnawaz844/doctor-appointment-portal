import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase"

const JWT_SECRET = process.env.JWT_SECRET || "doctor-portal-secure-2026"

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json()

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
        }

        const { data: user, error } = await supabase
            .from("users")
            .select("id, name, email, role, password, hospital_id")
            .eq("email", email.toLowerCase().trim())
            .single()

        if (error || !user) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
        }

        let doctor_id = undefined
        if (user.role === "DOCTOR") {
            const { data: doctor, error: docError } = await supabase
                .from("doctors")
                .select("id, name")
                .ilike("email", user.email.toLowerCase().trim())
                .single()
            
            if (doctor) {
                doctor_id = doctor.id
                console.log(`Doctor linked: ${doctor.name} (${doctor_id}) for user ${user.email}`)
            } else {
                console.log(`No doctor record found matching email: ${user.email}`, docError)
            }
        }

        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, role: user.role, hospital_id: user.hospital_id, doctor_id },
            JWT_SECRET,
            { expiresIn: "1d" }
        )

        const cookieStore = await cookies()
        cookieStore.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24,
            path: "/",
        })

        return NextResponse.json({
            message: "Login successful",
            user: { id: user.id, name: user.name, email: user.email, role: user.role, hospital_id: user.hospital_id, doctor_id },
        })
    } catch (error: any) {
        console.error("Login error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
