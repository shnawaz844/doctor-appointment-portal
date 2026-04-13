import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase"

const JWT_SECRET = process.env.JWT_SECRET || "healthcare-secret-key-2026"

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json()

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
        }

        const { data: user, error } = await supabase
            .from("users")
            .select("id, name, email, role, password")
            .eq("email", email.toLowerCase().trim())
            .single()

        if (error || !user) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
        }

        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, role: user.role },
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
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        })
    } catch (error: any) {
        console.error("Login error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
