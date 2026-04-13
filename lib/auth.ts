import jwt from "jsonwebtoken"
import { cookies } from "next/headers"

const JWT_SECRET = process.env.JWT_SECRET || "healthcare-secret-key-2026"

export interface AuthSession {
    id: string
    name: string
    email: string
    role: "ADMIN" | "DOCTOR" | "STAFF"
}

export async function getAuthSession(): Promise<AuthSession | null> {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get("token")?.value

        if (!token) return null

        const decoded = jwt.verify(token, JWT_SECRET) as AuthSession
        return decoded
    } catch (error) {
        return null
    }
}

export function hasRole(session: AuthSession | null, roles: string[]) {
    return session && roles.includes(session.role)
}
