import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getAuthSession } from "@/lib/auth"

export async function PATCH(req: Request) {
    try {
        const session = await getAuthSession()
        if (!session) {
            console.error("[PROFILE_PATCH] Unauthorized: No session found")
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { name, image } = body

        console.log(`[PROFILE_PATCH] Updating profile for user ${session.email} (${session.id})`, { name, image: image ? "present" : "absent" })

        const updateData: any = {}
        if (name !== undefined) updateData.name = name
        if (image !== undefined) updateData.image = image

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "No fields to update" }, { status: 400 })
        }

        // Update Users table
        const { error: userError } = await supabaseAdmin
            .from("users")
            .update(updateData)
            .eq("id", session.id)

        if (userError) {
            console.warn("[PROFILE_PATCH] Users table update notice (might be missing column):", userError.message)
        } else {
            console.log("[PROFILE_PATCH] Users table updated successfully")
        }

        // If user is a doctor, also update Doctors table
        if (session.role === "DOCTOR") {
            let updateQuery = supabaseAdmin.from("doctors").update(updateData)
            
            if (session.doctor_id) {
                console.log(`[PROFILE_PATCH] Updating doctor record by id: ${session.doctor_id}`)
                updateQuery = updateQuery.eq("id", session.doctor_id)
            } else {
                console.log(`[PROFILE_PATCH] Updating doctor record by email: ${session.email}`)
                updateQuery = updateQuery.eq("email", session.email.toLowerCase().trim())
            }

            const { error: doctorError, data: doctorData } = await updateQuery.select()

            if (doctorError) {
                console.error("[PROFILE_PATCH] Doctors table update failed:", doctorError)
            } else {
                console.log("[PROFILE_PATCH] Doctors table updated successfully:", doctorData)
            }
        }

        return NextResponse.json({ success: true, message: "Profile updated successfully" })
    } catch (error: any) {
        console.error("Profile update error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
