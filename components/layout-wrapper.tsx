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
                        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/50 px-4 md:hidden glass">
                            <SidebarTrigger className="-ml-1 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors" />
                            <div
                                className="text-sm font-black uppercase tracking-widest"
                                style={{
                                    background: "linear-gradient(135deg, oklch(0.55 0.22 285), oklch(0.62 0.18 200))",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    backgroundClip: "text",
                                }}
                            >
                                Aura Health
                            </div>
                        </header>
                    )}
                    {children}
                </SidebarInset>
                <Toaster position="top-right" richColors />
            </SidebarProvider>
        </ThemeProvider>
    )
}
