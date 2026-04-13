import { NextResponse } from "next/server"
import crypto from "crypto"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {
    try {
        const { email } = await req.json()

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 })
        }

        const { data: user, error } = await supabase
            .from("users")
            .select("id")
            .eq("email", email.toLowerCase().trim())
            .single()

        if (error || !user) {
            // To prevent email enumeration, we return success even if user doesn't exist
            return NextResponse.json({ message: "If an account with that email exists, a reset link has been sent." })
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString("hex")
        const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex")
        const expiry = new Date(Date.now() + 3600000).toISOString() // 1 hour

        const { error: updateErr } = await supabase
            .from("users")
            .update({ 
                reset_password_token: hashedToken, 
                reset_password_expires: expiry 
            })
            .eq("id", user.id)

        if (updateErr) throw updateErr

        return NextResponse.json({
            message: "Reset link generated.",
            resetToken // Returning token for user to "simulate" email link
        })
    } catch (error: any) {
        console.error("Forgot password error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
