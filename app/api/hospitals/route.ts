import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getAuthSession, hasRole } from "@/lib/auth"

export async function GET(request: Request) {
    try {
        const session = await getAuthSession()
        if (!session || !hasRole(session, ["SUPER_ADMIN"])) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { data: hospitals, error } = await supabase
            .from("hospitals")
            .select("*")
            .order("created_at", { ascending: false })

        if (error) throw error
        return NextResponse.json(hospitals)
    } catch (error) {
        console.error("Failed to fetch hospitals:", error)
        return NextResponse.json({ error: "Failed to fetch hospitals" }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const session = await getAuthSession()
        if (!session || !hasRole(session, ["SUPER_ADMIN"])) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const hospitalData = {
            hospital_name: body.hospital_name,
            location: body.location,
            phone_number: body.phone_number,
            address: body.address,
            status: body.status || "Active",
        }

        const { data, error } = await supabase
            .from("hospitals")
            .insert(hospitalData)
            .select()
            .single()

        if (error) throw error
        return NextResponse.json(data, { status: 201 })
    } catch (error) {
        console.error("Failed to create hospital:", error)
        return NextResponse.json({ error: "Failed to create hospital" }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getAuthSession()
        if (!session || !hasRole(session, ["SUPER_ADMIN"])) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { id, ...updateData } = body

        if (!id) return NextResponse.json({ error: "Missing hospital id" }, { status: 400 })

        const { data, error } = await supabase
            .from("hospitals")
            .update(updateData)
            .eq("id", id)
            .select()
            .single()

        if (error) throw error
        return NextResponse.json(data)
    } catch (error) {
        console.error("Failed to update hospital:", error)
        return NextResponse.json({ error: "Failed to update hospital" }, { status: 500 })
    }
}
