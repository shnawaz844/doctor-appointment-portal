"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Loader2, ShieldCheck, UserCog, Key, Plus, Trash2, Pencil } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordStatus, setPasswordStatus] = useState<"idle" | "success" | "error">("idle")
  const [passwordError, setPasswordError] = useState("")

  const [users, setUsers] = useState<any[]>([])
  const [usersLoading, setUsersLoading] = useState(false)

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    role: ""
  })
  const [editLoading, setEditLoading] = useState(false)

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me")
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
          if (data.user.role === "ADMIN") {
            fetchUsers()
          }
        }
      } catch (error) {
        console.error("Failed to fetch user:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  const fetchUsers = async () => {
    setUsersLoading(true)
    try {
      const res = await fetch("/api/auth/admin/users")
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setUsersLoading(false)
    }
  }

  const handleAdminResetPassword = async (userId: string) => {
    const newPassword = prompt("Enter new password for this user:")
    if (!newPassword) return

    try {
      const res = await fetch("/api/auth/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newPassword }),
      })

      if (res.ok) {
        alert("Password reset successfully")
      } else {
        const data = await res.json()
        alert(data.error || "Failed to reset password")
      }
    } catch (error) {
      alert("An unexpected error occurred")
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return

    try {
      const res = await fetch(`/api/auth/admin/users?userId=${userId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        alert("User deleted successfully")
        fetchUsers()
      } else {
        const data = await res.json()
        alert(data.error || "Failed to delete user")
      }
    } catch (error) {
      alert("An unexpected error occurred")
    }
  }

  const handleEditClick = (u: any) => {
    setEditingUser(u)
    setEditFormData({
      name: u.name,
      email: u.email,
      role: u.role
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditLoading(true)

    try {
      const res = await fetch("/api/auth/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingUser.id,
          ...editFormData
        }),
      })

      if (res.ok) {
        setIsEditDialogOpen(false)
        fetchUsers()
      } else {
        const data = await res.json()
        alert(data.error || "Failed to update user")
      }
    } catch (error) {
      alert("An unexpected error occurred")
    } finally {
      setEditLoading(false)
    }
  }


  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("Passwords do not match")
      setPasswordStatus("error")
      return
    }

    setPasswordLoading(true)
    setPasswordError("")
    setPasswordStatus("idle")

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        }),
      })

      if (res.ok) {
        setPasswordStatus("success")
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
        setTimeout(() => {
          setChangingPassword(false)
          setPasswordStatus("idle")
        }, 3000)
      } else {
        const data = await res.json()
        setPasswordError(data.error || "Failed to change password")
        setPasswordStatus("error")
      }
    } catch (err) {
      setPasswordError("An unexpected error occurred")
      setPasswordStatus("error")
    } finally {
      setPasswordLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <main className="flex-1">
      <div className="container mx-auto py-6 md:py-8 px-4 md:px-8">
        <PageHeader title="Settings" description="Manage your account and system preferences" />

        <div className="grid gap-6 max-w-3xl">
          {/* Profile Settings */}
          <Card className="glass-premium border-none shadow-xl">
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  defaultValue={user?.name || ""}
                  className="bg-white/50 dark:bg-slate-900/50 border-white/20 dark:border-slate-800"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue={user?.email || ""}
                  className="bg-white/50 dark:bg-slate-900/50 border-white/20 dark:border-slate-800"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  defaultValue={user?.role || ""}
                  disabled
                  className="bg-white/30 dark:bg-slate-900/30 border-white/10 dark:border-slate-800/50 font-bold uppercase tracking-wider text-xs"
                />
              </div>
              <Button className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">Save Changes</Button>
            </CardContent>
          </Card>

          {/* User Management (Admin Only) */}
          {user?.role === "ADMIN" && (
            <Card className="glass-premium border-none shadow-xl border-t-4 border-t-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="h-5 w-5 text-primary" />
                  Staff & User Management
                </CardTitle>
                <div className="flex items-center justify-between">
                  <CardDescription>Reset passwords for staff and doctors</CardDescription>
                  <Button asChild size="sm" className="gap-2">
                    <Link href="/signup">
                      <Plus className="h-4 w-4" />
                      Add New User
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4">
                      {users.filter(u => u.email !== user.email).map((u) => (
                        <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-white/40 dark:bg-slate-900/40 border border-white/20 dark:border-slate-800 gap-4">
                          <div>
                            <p className="font-bold text-foreground">{u.name}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <ShieldCheck className="h-3 w-3 text-emerald-500" />
                              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider">
                                {u.role}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditClick(u)}
                              className="w-full sm:w-auto text-xs font-bold border-primary/20 hover:bg-primary/10 transition-all gap-2"
                            >
                              <Pencil className="h-3 w-3" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAdminResetPassword(u.id)}
                              className="w-full sm:w-auto text-xs font-bold border-primary/20 hover:bg-primary/10 transition-all gap-2"
                            >
                              <Key className="h-3 w-3" />
                              Reset Password
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteUser(u.id)}
                              className="w-full sm:w-auto text-xs font-bold border-destructive/20 hover:bg-destructive/10 transition-all gap-2"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          </div>
                        </div>

                      ))}
                      {users.filter(u => u.email !== user.email).length === 0 && (
                        <p className="text-center text-sm text-muted-foreground py-4 italic">No other users found.</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* System Preferences */}
          <Card className="glass-premium border-none shadow-xl">
            <CardHeader>
              <CardTitle>System Preferences</CardTitle>
              <CardDescription>Configure system behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Enable AI Analysis</p>
                  <p className="text-sm text-muted-foreground">Automatically analyze uploaded documents</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator className="bg-white/10 dark:bg-slate-800/50" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive alerts for new patients and reports</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator className="bg-white/10 dark:bg-slate-800/50" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Dark Mode</p>
                  <p className="text-sm text-muted-foreground">Use dark theme for the interface</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Security (Personal) */}
          <Card className="glass-premium border-none shadow-xl">
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Manage your security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!changingPassword ? (
                <Button
                  variant="outline"
                  onClick={() => setChangingPassword(true)}
                  className="bg-transparent border-white/20 dark:border-slate-800 hover:bg-white/5 dark:hover:bg-slate-800/50 transition-all"
                >
                  Change My Password
                </Button>
              ) : (
                <form onSubmit={handlePasswordChange} className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  {passwordStatus === "error" && (
                    <div className="p-3 text-xs font-bold text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">
                      {passwordError}
                    </div>
                  )}
                  {passwordStatus === "success" && (
                    <div className="p-3 text-xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                      Password updated successfully!
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      required
                      className="bg-white/50 dark:bg-slate-900/50 border-white/20 dark:border-slate-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      required
                      className="bg-white/50 dark:bg-slate-900/50 border-white/20 dark:border-slate-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      required
                      className="bg-white/50 dark:bg-slate-900/50 border-white/20 dark:border-slate-800"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={passwordLoading}>
                      {passwordLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Update Password
                    </Button>
                    <Button variant="ghost" type="button" onClick={() => setChangingPassword(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
              <Separator className="bg-white/10 dark:bg-slate-800/50" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                </div>
                <Button variant="outline" size="sm" className="bg-transparent border-white/20 dark:border-slate-800 hover:bg-white/5 dark:hover:bg-slate-800/50 transition-all">
                  Enable
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="glass-premium border-none shadow-2xl sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Edit User Details</DialogTitle>
            <DialogDescription>Update name, email, and role for this staff member.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
                className="bg-white/50 dark:bg-slate-900/50 border-white/20 dark:border-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email Address</Label>
              <Input
                id="edit-email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                required
                className="bg-white/50 dark:bg-slate-900/50 border-white/20 dark:border-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={editFormData.role}
                onValueChange={(val) => setEditFormData({ ...editFormData, role: val })}
              >
                <SelectTrigger className="bg-white/50 dark:bg-slate-900/50 border-white/20 dark:border-slate-800">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrator</SelectItem>
                  <SelectItem value="DOCTOR">Doctor</SelectItem>
                  <SelectItem value="STAFF">Staff Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={editLoading} className="shadow-lg shadow-primary/20">
                {editLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  )
}
