import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
    try {
        const { data, error } = await supabase.from("search_results").select("*").order("date", { ascending: false })
        if (error) throw error
        return NextResponse.json(data)
    } catch (error) {
        console.error("Failed to fetch search results:", error)
        return NextResponse.json({ error: "Failed to fetch search results" }, { status: 500 })
    }
}
