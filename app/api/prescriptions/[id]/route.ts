import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const { error } = await supabase
            .from("prescriptions")
            .delete()
            .eq("id", id)

        if (error) {
            console.error("Supabase delete error:", error)
            return NextResponse.json({ error: "Failed to delete prescription" }, { status: 500 })
        }

        return NextResponse.json({ message: "Prescription deleted successfully" })
    } catch (error) {
        console.error("Failed to delete prescription:", error)
        return NextResponse.json({ error: "Failed to delete prescription" }, { status: 500 })
    }
}
