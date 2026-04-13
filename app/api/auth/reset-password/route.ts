import { NextResponse } from "next/server"
import crypto from "crypto"
import bcrypt from "bcryptjs"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {
    try {
        const { token, password } = await req.json()

        if (!token || !password) {
            return NextResponse.json({
                error: "Token and password are required"
            }, { status: 400 })
        }

        // Hash the token from the URL to compare with hashed token in DB
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex")

        const { data: user, error } = await supabase
            .from("users")
            .select("id")
            .eq("reset_password_token", hashedToken)
            .gt("reset_password_expires", new Date().toISOString())
            .single()

        if (error || !user) {
            return NextResponse.json({
                error: "Invalid or expired reset token"
            }, { status: 400 })
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const { error: updateErr } = await supabase
            .from("users")
            .update({
                password: hashedPassword,
                reset_password_token: null,
                reset_password_expires: null,
                updated_at: new Date().toISOString()
            })
            .eq("id", user.id)

        if (updateErr) throw updateErr

        return NextResponse.json({
            message: "Password reset successful"
        })
    } catch (error: any) {
        console.error("Reset password error:", error)
        return NextResponse.json({
            error: "Internal server error"
        }, { status: 500 })
    }
}
