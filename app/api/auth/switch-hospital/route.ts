import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import { getAuthSession, AuthSession } from "@/lib/auth"

const JWT_SECRET = process.env.JWT_SECRET || "doctor-portal-secure-2026"

export async function POST(req: Request) {
    try {
        const session = await getAuthSession()
        if (!session || session.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { hospital_id } = await req.json()

        // Create a new token with the updated hospital_id
        // We remove 'iat' and 'exp' from the payload to avoid conflicts with 'expiresIn'
        const { iat, exp, ...payload } = session as any
        const newToken = jwt.sign(
            { ...payload, hospital_id },
            JWT_SECRET,
            { expiresIn: "1d" }
        )

        const cookieStore = await cookies()
        cookieStore.set("token", newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24,
            path: "/",
        })

        return NextResponse.json({ message: "Switched hospital successfully" })
    } catch (error) {
        console.error("Switch hospital error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
