import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"
import { getAuthSession } from "@/lib/auth"

// GET /api/auth/admin/users - Fetch all users (Admin only)
export async function GET() {
    try {
        const session = await getAuthSession()
        if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        let query = supabase
            .from("users")
            .select("id, name, email, role, created_at, hospital_id")
            .order("role", { ascending: true })
            .order("name", { ascending: true })

        // Enforce multi-tenancy: Admins only see users in their hospital
        if (session.hospital_id) {
            query = query.eq("hospital_id", session.hospital_id)
        }

        // Security: Regular Admins NEVER see Super Admins
        if (session.role === "ADMIN") {
            query = query.neq("role", "SUPER_ADMIN")
        }

        const { data: users, error } = await query

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
        if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        const { userId, newPassword } = await req.json()
        if (!userId || !newPassword) {
            return NextResponse.json({ error: "User ID and new password are required" }, { status: 400 })
        }

        // Security check: If requester is ADMIN, ensure target is in same hospital and NOT a super admin
        if (session.role === "ADMIN") {
            const { data: targetUser } = await supabase
                .from("users")
                .select("role, hospital_id")
                .eq("id", userId)
                .single()

            if (!targetUser || targetUser.role === "SUPER_ADMIN" || targetUser.hospital_id !== session.hospital_id) {
                return NextResponse.json({ error: "Unauthorized to modify this user" }, { status: 403 })
            }
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
