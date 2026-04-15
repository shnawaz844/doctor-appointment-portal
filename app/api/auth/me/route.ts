import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase"

const JWT_SECRET = process.env.JWT_SECRET || "doctor-portal-secure-2026"

export async function GET() {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get("token")?.value

        if (!token) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
        }

        const decoded: any = jwt.verify(token, JWT_SECRET)

        let userQuery = await supabase
            .from("users")
            .select("id, name, email, role, image, created_at, hospital_id")
            .eq("id", decoded.id)
            .single()

        // Backward compatibility for databases where users.image has not been added yet.
        if (userQuery.error?.message?.includes("column users.image does not exist")) {
            userQuery = await supabase
                .from("users")
                .select("id, name, email, role, created_at, hospital_id")
                .eq("id", decoded.id)
                .single()
        }

        const { data: user, error } = userQuery

        if (error || !user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const effectiveRole = decoded.role || user.role
        const effectiveHospitalId = decoded.hospital_id || user.hospital_id

        let hospital_name = null;
        if (effectiveHospitalId) {
            const { data: hospitalData, error: hospitalError } = await supabase
                .from("hospitals")
                .select("hospital_name")
                .eq("id", effectiveHospitalId)
                .maybeSingle();

            if (hospitalError) {
                console.error("Error fetching hospital data:", hospitalError);
            }

            if (hospitalData) {
                hospital_name = hospitalData.hospital_name;
            }
        }

        let specialty = null;
        let doctor_id = null;
        let image = (user as any).image || null;

        if (effectiveRole === "DOCTOR") {
            const { data: doctorData, error: docError } = await supabase
                .from("doctors")
                .select("id, specialty_id, image")
                .ilike("email", user.email.trim())
                .maybeSingle();

            if (docError) {
                console.error("Error fetching doctor data in api/auth/me:", docError);
            }

            if (doctorData) {
                doctor_id = doctorData.id;
                image = doctorData.image || image;

                if (doctorData.specialty_id) {
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
        }

        return NextResponse.json({
            user: {
                ...user,
                role: effectiveRole,
                hospital_id: effectiveHospitalId,
                specialty,
                hospital_name,
                doctor_id,
                image
            }
        })
    } catch (error) {
        console.error("Auth Me error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
