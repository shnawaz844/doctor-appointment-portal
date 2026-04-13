import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"
import { getAuthSession } from "@/lib/auth"

// GET /api/auth/admin/users - Fetch all users (Admin only)
export async function GET() {
    try {
        const session = await getAuthSession()
        if (!session || session.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        const { data: users, error } = await supabase
            .from("users")
            .select("id, name, email, role, created_at")
            .order("role", { ascending: true })
            .order("name", { ascending: true })

        if (error) throw error
        return NextResponse.json(users)
    } catch (error) {
        console.error("Failed to fetch users:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// POST /api/auth/admin/users - Reset a user's password (Admin only)
export async function POST(req: Request) {
    try {
        const session = await getAuthSession()
        if (!session || session.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        const { userId, newPassword } = await req.json()
        if (!userId || !newPassword) {
            return NextResponse.json({ error: "User ID and new password are required" }, { status: 400 })
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(newPassword, salt)

        const { error: updateErr } = await supabase
            .from("users")
            .update({
                password: hashedPassword,
                updated_at: new Date().toISOString()
            })
            .eq("id", userId)

        if (updateErr) throw updateErr

        return NextResponse.json({ message: "Password reset successfully" })
    } catch (error) {
        console.error("Failed to reset password:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
