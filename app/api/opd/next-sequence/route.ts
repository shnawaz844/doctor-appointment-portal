import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getAuthSession } from "@/lib/auth"

export async function GET() {
    try {
        const session = await getAuthSession()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const now = new Date()
        // Format to ISO with start of day for Supabase comparison
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

        // Count records created today to generate the next sequence number
        const { count, error } = await supabase
            .from("opd")
            .select("*", { count: "exact", head: true })
            .gte("created_at", startOfDay)

        if (error) throw error

        return NextResponse.json({ sequence: (count || 0) + 1 })
    } catch (error) {
        console.error("Failed to fetch sequence:", error)
        return NextResponse.json({ error: "Failed to fetch sequence" }, { status: 500 })
    }
}
