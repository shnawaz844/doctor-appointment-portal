import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default function middleware(request: NextRequest) {
    const token = request.cookies.get("token")?.value
    const { pathname } = request.nextUrl

    // Exclude API routes and public assets
    if (pathname.startsWith("/api") || pathname.includes("_next") || pathname.includes("favicon.ico")) {
        return NextResponse.next()
    }

    const isAuthPage = pathname === "/login" || pathname === "/signup"

    if (!token && !isAuthPage) {
        return NextResponse.redirect(new URL("/login", request.url))
    }

    if (token && pathname === "/login") {
        return NextResponse.redirect(new URL("/", request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
