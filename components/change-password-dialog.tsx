"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Loader2, Lock, Eye, EyeOff } from "lucide-react"

export function ChangePasswordDialog({ trigger }: { trigger?: React.ReactNode }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [formData, setFormData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    })
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
    const [errorMsg, setErrorMsg] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (formData.newPassword !== formData.confirmPassword) {
            setErrorMsg("Passwords do not match")
            setStatus("error")
            return
        }

        setLoading(true)
        setErrorMsg("")
        setStatus("idle")

        try {
            const res = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword
                }),
            })

            if (res.ok) {
                setStatus("success")
                setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" })
                setTimeout(() => {
                    setOpen(false)
                    setStatus("idle")
                }, 2000)
            } else {
                const data = await res.json()
                setErrorMsg(data.error || "Failed to change password")
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
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline">Change Password</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>
                        Update your account password to keep it secure.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    {status === "error" && (
                        <div className="p-3 text-xs font-bold text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">
                            {errorMsg}
                        </div>
                    )}
                    {status === "success" && (
                        <div className="p-3 text-xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-center">
                            Password updated successfully!
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="currentPassword"
                                type={showPassword ? "text" : "password"}
                                value={formData.currentPassword}
                                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                required
                                className="pl-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3.5 text-muted-foreground"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="newPassword"
                                type={showPassword ? "text" : "password"}
                                value={formData.newPassword}
                                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                required
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="confirmPassword"
                                type={showPassword ? "text" : "password"}
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                required
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button type="submit" className="flex-1" disabled={loading || status === "success"}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Update Password
                        </Button>
                        <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
