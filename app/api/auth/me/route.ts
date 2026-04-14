import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase"

const JWT_SECRET = process.env.JWT_SECRET || "healthcare-secret-key-2026"

export async function GET() {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get("token")?.value

        if (!token) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
        }

        const decoded: any = jwt.verify(token, JWT_SECRET)

        const { data: user, error } = await supabase
            .from("users")
            .select("id, name, email, role, created_at, hospital_id")
            .eq("id", decoded.id)
            .single()

        if (error || !user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        let hospital_name = null;
        if (user.hospital_id) {
            const { data: hospitalData, error: hospitalError } = await supabase
                .from("hospitals")
                .select("hospital_name")
                .eq("id", user.hospital_id)
                .maybeSingle();
            
            if (hospitalError) {
                console.error("Error fetching hospital data:", hospitalError);
            }

            if (hospitalData) {
                hospital_name = hospitalData.hospital_name;
            }
        }

        let specialty = null;
        if (user.role === "DOCTOR") {
            const { data: doctorData, error: docError } = await supabase
                .from("doctors")
                .select("specialty_id")
                .eq("email", user.email)
                .maybeSingle();
            
            if (docError) {
                console.error("Error fetching doctor data:", docError);
            }

            if (doctorData?.specialty_id) {
                const { data: specData, error: specError } = await supabase
                    .from("specialties")
                    .select("name")
                    .eq("id", doctorData.specialty_id)
                    .maybeSingle();
                
                if (specError) {
                    console.error("Error fetching specialty data:", specError);
                }

                if (specData) {
                    specialty = specData.name;
                }
            }
        }

        return NextResponse.json({ user: { ...user, specialty, hospital_name } })
    } catch (error) {
        console.error("Auth Me error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
