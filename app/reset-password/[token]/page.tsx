"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Activity, Loader2, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ResetPasswordPage() {
    const params = useParams()
    const router = useRouter()
    const token = params.token as string

    const [loading, setLoading] = useState(false)
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
    const [errorMsg, setErrorMsg] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            setErrorMsg("Passwords do not match")
            setStatus("error")
            return
        }

        if (password.length < 6) {
            setErrorMsg("Password must be at least 6 characters")
            setStatus("error")
            return
        }

        setLoading(true)
        setErrorMsg("")
        setStatus("idle")

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            })

            const data = await res.json()

            if (res.ok) {
                setStatus("success")
                setTimeout(() => {
                    router.push("/login")
                }, 3000)
            } else {
                setErrorMsg(data.error || "Failed to reset password")
                setStatus("error")
            }
        } catch (err) {
            setErrorMsg("An unexpected error occurred")
            setStatus("error")
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
                    <CardTitle className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Reset Password</CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400">
                        {status === "success"
                            ? "Your password has been reset successfully."
                            : "Enter your new password below to regain access."}
                    </CardDescription>
                </CardHeader>
                {status !== "success" ? (
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            {status === "error" && (
                                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{errorMsg}</AlertDescription>
                                </Alert>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Min. 6 characters"
                                        className="pl-10 pr-10 h-12 bg-white/50 dark:bg-slate-900/50 border-white/20 dark:border-slate-800"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3.5 text-muted-foreground"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="confirmPassword"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Repeat your password"
                                        className="pl-10 h-12 bg-white/50 dark:bg-slate-900/50 border-white/20 dark:border-slate-800"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                                        Resetting...
                                    </>
                                ) : (
                                    "Save New Password"
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                ) : (
                    <CardContent className="space-y-6 pt-4 text-center">
                        <div className="flex justify-center flex-col items-center space-y-4 py-8">
                            <div className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                                <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Password Updated</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    You'll be redirected to the login page in a few seconds.
                                </p>
                            </div>
                        </div>
                        <Button
                            asChild
                            className="w-full h-12 font-bold transition-all duration-200"
                        >
                            <Link href="/login">Login Now</Link>
                        </Button>
                    </CardContent>
                )}
            </Card>
        </div>
    )
}
