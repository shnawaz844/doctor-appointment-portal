"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Activity, Loader2, Mail, Lock, User, Building, AlertCircle, ChevronRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SignupPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "STAFF",
    })

    useEffect(() => {
        async function checkAdmin() {
            setLoading(true)
            try {
                const res = await fetch("/api/auth/me")
                if (res.ok) {
                    const data = await res.json()
                    if (data.user.role !== "ADMIN") {
                        router.push("/")
                    }
                } else {
                    router.push("/login")
                }
            } catch (err) {
                console.error("Auth check failed:", err)
                router.push("/login")
            } finally {
                setLoading(false)
            }
        }
        checkAdmin()
    }, [router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })

            const data = await res.json()

            if (res.ok) {
                router.push("/login")
            } else {
                setError(data.error || "Signup failed")
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
                    <CardTitle className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Create Account</CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400">
                        Join MedicalHub healthcare management system
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        placeholder="John Doe"
                                        className="pl-10 bg-white/50 dark:bg-slate-900/50 border-white/20 dark:border-slate-800"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                                >
                                    <SelectTrigger className="bg-white/50 dark:bg-slate-900/50 border-white/20 dark:border-slate-800">
                                        <SelectValue placeholder="Select Role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ADMIN">Administrator</SelectItem>
                                        <SelectItem value="DOCTOR">Doctor</SelectItem>
                                        <SelectItem value="STAFF">Staff</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="john@example.com"
                                    className="pl-10 bg-white/50 dark:bg-slate-900/50 border-white/20 dark:border-slate-800"
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
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-10 bg-white/50 dark:bg-slate-900/50 border-white/20 dark:border-slate-800"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                                    Creating Account...
                                </>
                            ) : (
                                <>
                                    Get Started <ChevronRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                            Already have an account?{" "}
                            <Link href="/login" className="font-bold text-primary hover:underline transition-all">
                                Sign in
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
