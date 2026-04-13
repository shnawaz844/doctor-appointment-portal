"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Activity, Loader2, Mail, Lock, AlertCircle, Eye, EyeOff } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    })
    const [showPassword, setShowPassword] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })

            const data = await res.json()

            if (res.ok) {
                router.push("/")
                router.refresh()
            } else {
                setError(data.error || "Login failed")
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
                    <CardTitle className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Welcome Back</CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400">
                        Enter your credentials to access your dashboard
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@medicalhub.com"
                                    className="pl-10 h-12 bg-white/50 dark:bg-slate-900/50 border-white/20 dark:border-slate-800"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    className="pl-10 pr-10 h-12 bg-white/50 dark:bg-slate-900/50 border-white/20 dark:border-slate-800"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
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
                                    Logging in...
                                </>
                            ) : (
                                "Sign In"
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
