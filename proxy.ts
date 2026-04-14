import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from '@/utils/supabase/middleware'

export default async function middleware(request: NextRequest) {
    const { supabaseResponse } = createClient(request)
    const token = request.cookies.get("token")?.value
    const { pathname } = request.nextUrl

    // Exclude API routes and public assets
    if (pathname.startsWith("/api") || pathname.includes("_next") || pathname.includes("favicon.ico")) {
        return supabaseResponse
    }

    const isAuthPage = pathname === "/login" || pathname === "/signup"

    if (!token && !isAuthPage) {
        return NextResponse.redirect(new URL("/login", request.url))
    }

    if (token && pathname === "/login") {
        return NextResponse.redirect(new URL("/", request.url))
    }

    return supabaseResponse
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
