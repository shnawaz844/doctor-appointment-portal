import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { supabase } from "@/lib/supabase"
import { getAuthSession } from "@/lib/auth"

export async function POST(req: Request) {
    try {
        const session = await getAuthSession()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { currentPassword, newPassword } = await req.json()

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: "Current and new passwords are required" }, { status: 400 })
        }

        const { data: user, error } = await supabase
            .from("users")
            .select("id, password")
            .eq("id", session.id)
            .single()

        if (error || !user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password)
        if (!isMatch) {
            return NextResponse.json({ error: "Incorrect current password" }, { status: 400 })
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10)

        const { error: updateErr } = await supabase
            .from("users")
            .update({ password: hashedPassword, updated_at: new Date().toISOString() })
            .eq("id", session.id)

        if (updateErr) throw updateErr

        return NextResponse.json({ message: "Password updated successfully" })
    } catch (error: any) {
        console.error("Change password error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
