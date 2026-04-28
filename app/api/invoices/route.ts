import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getAuthSession, hasRole } from "@/lib/auth"

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const today = searchParams.get("today") === "true"

    try {
        const session = await getAuthSession()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        let query = supabase.from("invoices").select("*").order("created_at", { ascending: false })

        if (today) {
            const now = new Date()
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
            const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString()
            query = query.gte("created_at", startOfDay).lte("created_at", endOfDay)
        }

        if (session.role !== "SUPER_ADMIN") {
            if (!session.hospital_id) return NextResponse.json({ error: "No hospital assigned" }, { status: 403 })
            query = query.eq("hospital_id", session.hospital_id)
        }

        const { data, error } = await query
        if (error) throw error
        return NextResponse.json(data)
    } catch (error) {
        console.error("Failed to fetch invoices:", error)
        return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await getAuthSession()
        if (!hasRole(session, ["ADMIN", "STAFF"])) {
            return NextResponse.json({ error: "Forbidden: Only Admin or Staff can create invoices" }, { status: 403 })
        }

        const body = await req.json()
        const invoiceId = body.invoiceId || body.invoice_id || `INV-${Math.floor(100000 + Math.random() * 900000)}`

        const invoiceData = {
            invoice_id: invoiceId,
            patient_id: body.patientId || body.patient_id,
            patient_name: body.patientName || body.patient_name,
            amount: body.amount,
            service: body.service,
            date: body.date || new Date().toISOString(),
            status: body.status || "Pending",
            payment_method: body.paymentMethod || body.payment_method || "Cash",
            notes: body.notes,
            hospital_id: session?.hospital_id || body.hospital_id,
        }

        const { data, error } = await supabase.from("invoices").insert(invoiceData).select().single()
        if (error) throw error
        return NextResponse.json(data, { status: 201 })
    } catch (error) {
        console.error("Failed to create invoice:", error)
        return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 })
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json()
        const { invoice_id, invoiceId, ...updateData } = body
        const id = invoice_id || invoiceId
        if (!id) return NextResponse.json({ error: "Missing invoice_id" }, { status: 400 })

        const { data, error } = await supabase
            .from("invoices")
            .update({ ...updateData, updated_at: new Date().toISOString() })
            .eq("invoice_id", id)
            .select()
            .single()

        if (error) throw error
        return NextResponse.json(data)
    } catch (error) {
        console.error("Failed to update invoice:", error)
        return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 })
    }
}
