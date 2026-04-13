"use client"

import { useState } from "react"
import Link from "next/link"
import { Activity, Loader2, Mail, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ForgotPasswordPage() {
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState("")
    const [resetToken, setResetToken] = useState("") // For demo purposes

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            })

            const data = await res.json()

            if (res.ok) {
                setSubmitted(true)
                if (data.resetToken) {
                    setResetToken(data.resetToken)
                }
            } else {
                setError(data.error || "Failed to send reset link")
            }
        } catch (err) {
            setError("An unexpected error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-blue-100 via-white to-purple-100 dark:from-slate-900 dark:via-slate-950 dark:to-blue-900/20">
            <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="blob top-[-10%] left-[-10%] bg-blue-500/20" />
                <div className="blob bottom-[-10%] right-[-10%] bg-purple-500/20 animation-delay-2000" />
            </div>

            <Card className="w-full max-w-md border-none glass-premium animate-in fade-in slide-in-from-bottom-8 duration-700">
                <CardHeader className="space-y-2 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-primary/10 rounded-2xl">
                            <Activity className="h-8 w-8 text-primary animate-pulse" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Forgot Password?</CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400">
                        {submitted
                            ? "Check your email for instructions to reset your password."
                            : "Enter your email address and we'll send you a link to reset your password."}
                    </CardDescription>
                </CardHeader>
                {!submitted ? (
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            {error && (
                                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="Enter your registered email"
                                        className="pl-10 h-12 bg-white/50 dark:bg-slate-900/50 border-white/20 dark:border-slate-800"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4 pt-4">
                            <Button
                                type="submit"
                                className="w-full h-12 font-bold text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] transition-all duration-200"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending Link...
                                    </>
                                ) : (
                                    "Send Reset Link"
                                )}
                            </Button>
                            <Link
                                href="/login"
                                className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-primary transition-all group"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                                Back to Sign In
                            </Link>
                        </CardFooter>
                    </form>
                ) : (
                    <CardContent className="space-y-6 pt-4 text-center">
                        <div className="flex justify-center flex-col items-center space-y-4 py-8">
                            <div className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                                <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Email Sent</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    A password reset link has been sent to {email}.
                                </p>
                            </div>
                        </div>

                        {resetToken && (
                            <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl text-left">
                                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">✨ Simulation Mode (Reset Token)</p>
                                <code className="text-[10px] break-all text-slate-600 dark:text-slate-300 font-mono">
                                    {resetToken}
                                </code>
                                <div className="mt-3">
                                    <Link
                                        href={`/reset-password/${resetToken}`}
                                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        Click here to reset password directly →
                                    </Link>
                                </div>
                            </div>
                        )}

                        <Button
                            asChild
                            variant="outline"
                            className="w-full h-12 font-bold transition-all duration-200 border-slate-200 dark:border-slate-800"
                        >
                            <Link href="/login">Return to Sign In</Link>
                        </Button>
                    </CardContent>
                )}
            </Card>
        </div>
    )
}
