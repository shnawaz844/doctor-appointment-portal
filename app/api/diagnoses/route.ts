import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
    try {
        const { data, error } = await supabase.from("diagnoses").select("*").order("count", { ascending: false })
        if (error) throw error
        return NextResponse.json(data)
    } catch (error) {
        console.error("Failed to fetch diagnoses:", error)
        return NextResponse.json({ error: "Failed to fetch diagnoses" }, { status: 500 })
    }
}
