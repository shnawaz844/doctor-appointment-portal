"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/theme-provider"

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isChatPage = pathname === "/chat"
    const isAuthPage = pathname === "/login" || pathname === "/signup"

    // If it's an auth page (login/signup), don't wrap with SidebarProvider or show AppSidebar
    if (isAuthPage) {
        return (
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                <div className="min-h-screen w-full">{children}</div>
                <Toaster position="top-right" richColors />
            </ThemeProvider>
        )
    }

    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <SidebarProvider defaultOpen={true}>
                {!isChatPage && <AppSidebar />}
                <SidebarInset>
                    {!isChatPage && (
                        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 md:hidden">
                            <SidebarTrigger className="-ml-1" />
                        </header>
                    )}
                    {children}
                </SidebarInset>
                <Toaster position="top-right" richColors />
            </SidebarProvider>
        </ThemeProvider>
    )
}
