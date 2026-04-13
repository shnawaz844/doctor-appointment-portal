import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getAuthSession } from "@/lib/auth"

export async function GET(
  request: Request,
  { params }: { params: { uccn: string } }
) {
  try {
    // const session = await getAuthSession()
    // if (!session) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }

    const { uccn } = await params

    if (!uccn) {
      return NextResponse.json({ error: "UCCN is required" }, { status: 400 })
    }

    // Join appointments with prescriptions using prescription_id foreign key
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        *,
        prescriptions (*)
      `)
      .eq("unique_citizen_card_number", uccn)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Failed to fetch appointments by UCCN:", error)
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 })
  }
}
