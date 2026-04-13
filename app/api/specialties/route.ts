import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
    try {
        const { data, error } = await supabase.from("specialties").select("*").order("name", { ascending: true })
        if (error) throw error
        return NextResponse.json(data)
    } catch (error) {
        console.error("Failed to fetch specialties:", error)
        return NextResponse.json({ error: "Failed to fetch specialties" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const specialtyId = `SPEC-${Math.floor(1000 + Math.random() * 9000)}`

        const { data, error } = await supabase.from("specialties").insert({
            id: specialtyId,
            name: body.name,
            description: body.description,
        }).select().single()

        if (error) throw error
        return NextResponse.json(data, { status: 201 })
    } catch (error) {
        console.error("Failed to create specialty:", error)
        return NextResponse.json({ error: "Failed to create specialty" }, { status: 500 })
    }
}
