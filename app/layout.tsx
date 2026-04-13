import type React from "react"
import type { Metadata, Viewport } from "next"
import { Poppins, Libre_Baskerville, IBM_Plex_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AIChatbot } from "@/components/ai-chatbot"
import "./globals.css"
import { LayoutWrapper } from "@/components/layout-wrapper"

const fontSans = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  preload: false,
})

const fontSerif = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-serif",
  preload: false,
})

const fontMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  preload: false,
})

export const metadata: Metadata = {
  title: "Healthcare Admin Dashboard",
  description: "Patient Management System",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background" suppressHydrationWarning>
      <body className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} font-sans antialiased`}>
        <LayoutWrapper>{children}</LayoutWrapper>
        {/* <AIChatbot /> */}
        <Analytics />
      </body>
    </html>
  )
}
