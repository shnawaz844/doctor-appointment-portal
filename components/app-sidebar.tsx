"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  LayoutDashboard,
  Users,
  FileImage,
  Settings,
  Activity,
  Calendar,
  CreditCard,
  FlaskConical,
  Pill,
  ClipboardList,
  LogOut,
  ShieldCheck,
  Building,
  Lock,
  Camera,
  Loader2,
  Stethoscope,
  Mail,
  ChevronRight,
} from "lucide-react"
import { useRef } from "react"
import { toast } from "sonner"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { usePathname, useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { ChangePasswordDialog } from "@/components/change-password-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ModeToggle } from "@/components/mode-toggle"
import { resolveImageUrl } from "@/lib/image-url"

const navItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    roles: ["ADMIN", "DOCTOR", "STAFF"],
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    title: "OPD",
    href: "/opd",
    icon: Stethoscope,
    roles: ["STAFF", "ADMIN"],
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
  {
    title: "OPD List",
    href: "/opd-list",
    icon: ClipboardList,
    roles: ["STAFF", "ADMIN", "DOCTOR"],
    color: "text-teal-500",
    bg: "bg-teal-500/10",
  },
  {
    title: "Appointments",
    href: "/appointments",
    icon: Calendar,
    roles: ["ADMIN", "DOCTOR", "STAFF"],
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
  },
  {
    title: "Patients",
    href: "/patients",
    icon: Users,
    roles: ["ADMIN", "DOCTOR", "STAFF"],
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    title: "Doctors",
    href: "/doctors",
    icon: Users,
    roles: ["ADMIN"],
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    title: "Specialties",
    href: "/specialties",
    icon: ClipboardList,
    roles: ["ADMIN"],
    color: "text-fuchsia-500",
    bg: "bg-fuchsia-500/10",
  },
  {
    title: "Lab Results",
    href: "/lab-results",
    icon: FlaskConical,
    roles: ["ADMIN", "DOCTOR"],
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    title: "Prescriptions",
    href: "/prescriptions",
    icon: Pill,
    roles: ["ADMIN", "DOCTOR"],
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  {
    title: "Billing & Invoices",
    href: "/billing",
    icon: CreditCard,
    roles: ["ADMIN", "STAFF"],
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    title: "Medical Records",
    href: "/medical-records",
    icon: ClipboardList,
    roles: ["ADMIN", "DOCTOR"],
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    title: "Imaging",
    href: "/imaging",
    icon: FileImage,
    roles: ["ADMIN", "DOCTOR"],
    color: "text-pink-500",
    bg: "bg-pink-500/10",
  },
  {
    title: "System Settings",
    href: "/settings",
    icon: Settings,
    roles: ["ADMIN"],
    color: "text-slate-500",
    bg: "bg-slate-500/10",
  },
  {
    title: "Hospitals",
    href: "/super-admin/hospitals",
    icon: Building,
    roles: ["SUPER_ADMIN"],
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { state } = useSidebar()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isCollapsed = state === "collapsed"

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me")
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error("Failed to fetch user:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const uploadRes = await fetch("/api/auth/profile/image", { method: "POST", body: formData })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed")
      const imageUrl = uploadData.imageUrl || uploadData.url
      setUser({ ...user, image: imageUrl })
      toast.success("Profile image updated successfully")
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile image")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const filteredNavItems = loading
    ? []
    : navItems.filter((item) => user && item.roles.includes(user.role.toUpperCase()))
  const profileImage = resolveImageUrl(user?.image)

  const initials = user?.name?.substring(0, 2).toUpperCase() || "??"

  return (
    <Sidebar
      collapsible="icon"
      className="border-r-0 bg-sidebar shadow-2xl shadow-black/10"
    >
      {/* ── Header ── */}
      <SidebarHeader
        className={cn(
          "border-b border-sidebar-border/60 transition-all duration-300",
          isCollapsed ? "px-2 py-4" : "px-4 py-5"
        )}
      >
        <div className={cn(
          "flex items-center transition-all duration-300",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          <Link href="/" className="flex items-center gap-3 group">
            {/* Logo Icon */}
            <div className={cn(
              "shrink-0 rounded-2xl flex items-center justify-center",
              "bg-gradient-to-br from-primary/90 to-violet-600",
              "shadow-lg shadow-primary/30 transition-all duration-500",
              "group-hover:shadow-primary/50 group-hover:scale-105 group-hover:rotate-3",
              isCollapsed ? "p-1.5 w-9 h-9" : "p-2 w-10 h-10"
            )}>
              <Stethoscope className={cn("text-white", isCollapsed ? "h-4 w-4" : "h-5 w-5")} />
            </div>

            {!isCollapsed && (
              <div className="flex flex-col min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
                <span
                  className="text-base font-black uppercase tracking-widest leading-none"
                  style={{
                    background: "linear-gradient(135deg, oklch(0.55 0.22 285), oklch(0.62 0.18 200))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Doctor Appointment Portal
                </span>
                <span className="text-[10px] font-bold tracking-wider text-muted-foreground/80 uppercase mt-0.5">
                  {user?.hospital_name || "Management System"}
                </span>
              </div>
            )}
          </Link>

          {!isCollapsed && (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarTrigger className="h-8 w-8 rounded-xl border border-sidebar-border/60 bg-sidebar-accent/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all duration-300" />
                </TooltipTrigger>
                <TooltipContent side="right"><p>Collapse Sidebar</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {isCollapsed && (
          <div className="flex justify-center mt-2">
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarTrigger className="h-8 w-8 rounded-xl border border-sidebar-border/60 bg-sidebar-accent/50 hover:bg-primary/10 hover:text-primary transition-all duration-300" />
                </TooltipTrigger>
                <TooltipContent side="right"><p>Expand Sidebar</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </SidebarHeader>

      {/* ── Navigation ── */}
      <SidebarContent className={cn("transition-all duration-300 py-3", isCollapsed ? "px-2" : "px-3")}>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-10 w-full shimmer rounded-xl bg-sidebar-accent/30"
                style={{ animationDelay: `${i * 0.08}s` }}
              />
            ))}
          </div>
        ) : (
          <SidebarMenu className="space-y-0.5">
            {filteredNavItems.map((item, idx) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.title}
                    className={cn(
                      "flex items-center gap-3 rounded-xl text-sm font-semibold transition-all duration-200 group/nav",
                      isCollapsed ? "justify-center px-0 w-10 h-10 mx-auto py-0" : "px-3 py-2.5",
                      isActive
                        ? [
                          "bg-primary/10 border border-primary/20",
                          "shadow-sm shadow-primary/10",
                          "text-primary",
                        ]
                        : [
                          "hover:bg-sidebar-accent/70",
                          "text-sidebar-foreground/65 hover:text-sidebar-foreground",
                          "border border-transparent",
                        ]
                    )}
                  >
                    <Link href={item.href} className="flex items-center w-full gap-3">
                      <div className={cn(
                        "flex items-center justify-center rounded-lg transition-all duration-300 shrink-0",
                        isCollapsed ? "w-full h-full rounded-xl" : "w-7 h-7",
                        isActive
                          ? `${item.bg} ${item.color} scale-105`
                          : `group-hover/nav:${item.bg} ${item.color} opacity-70 group-hover/nav:opacity-100`
                      )}>
                        <Icon className={cn(
                          "transition-all duration-300",
                          isCollapsed ? "h-5 w-5" : "h-4 w-4"
                        )} />
                      </div>
                      {!isCollapsed && (
                        <span className="transition-all duration-200 font-semibold">
                          {item.title}
                        </span>
                      )}
                      {!isCollapsed && isActive && (
                        <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-50" />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        )}
      </SidebarContent>

      {/* ── Footer ── */}
      <SidebarFooter className={cn(
        "border-t border-sidebar-border/60 transition-all duration-300",
        isCollapsed ? "p-2 gap-2" : "p-3 gap-3"
      )}>
        <div className={cn("flex items-center", isCollapsed ? "flex-col gap-2" : "flex-col gap-2")}>
          {/* User Profile Dialog */}
          {user && (
            <Dialog>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "flex items-center justify-start gap-3 h-auto rounded-xl",
                          "border border-sidebar-border/50 bg-sidebar-accent/40",
                          "hover:bg-primary/8 hover:border-primary/25 hover:shadow-sm hover:shadow-primary/10",
                          "transition-all duration-300 group/profile",
                          isCollapsed ? "w-10 h-10 p-0 justify-center" : "w-full py-2.5 px-3"
                        )}
                      >
                        <div className="relative shrink-0">
                          <div className={cn(
                            "overflow-hidden rounded-full border-2 border-primary/20",
                            "ring-2 ring-transparent group-hover/profile:ring-primary/20 transition-all duration-300",
                            isCollapsed ? "h-8 w-8" : "h-8 w-8"
                          )}>
                            {profileImage ? (
                              <img src={profileImage} alt={user.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full bg-gradient-to-br from-primary/80 to-violet-600 flex items-center justify-center text-white text-[10px] font-black">
                                {initials}
                              </div>
                            )}
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-sidebar shadow-sm shadow-emerald-500/50" />
                        </div>

                        {!isCollapsed && (
                          <div className="flex flex-col items-start min-w-0 text-left animate-in fade-in duration-300">
                            <span className="text-sm font-bold text-sidebar-foreground truncate w-full group-hover/profile:text-primary transition-colors">
                              {user.name}
                            </span>
                            <div className="flex items-center gap-1">
                              <ShieldCheck className="h-2.5 w-2.5 text-emerald-500" />
                              <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">
                                {user.role}
                              </span>
                            </div>
                          </div>
                        )}
                      </Button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">
                      <p>{user.name} ({user.role})</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>

              {/* Profile Dialog Content */}
              <DialogContent className="sm:max-w-[420px] bg-popover border border-border shadow-2xl overflow-hidden rounded-3xl p-0">
                {/* Decorative top bar */}
                <div className="h-1.5 w-full bg-gradient-to-r from-primary via-violet-500 to-cyan-500 rounded-t-3xl" />
                <div className="p-6">
                  <DialogHeader className="mb-6">
                    <DialogTitle className="text-2xl font-black">User Profile</DialogTitle>
                    <DialogDescription className="font-medium text-muted-foreground">
                      Your account details and permissions
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-5">
                    {/* Avatar Section */}
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                      <div className="relative group/avatar">
                        <Avatar className="h-20 w-20 border-2 border-primary/25 shadow-xl shadow-primary/10 transition-all duration-300 group-hover/avatar:border-primary/50">
                          <AvatarImage src={profileImage} className="object-cover" />
                          <AvatarFallback className="bg-gradient-to-br from-primary/70 to-violet-600 text-white text-2xl font-black">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/*"
                            className="hidden"
                          />
                          <Button
                            size="icon"
                            variant="secondary"
                            className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full shadow-lg border border-primary/10 hover:bg-primary hover:text-white transition-all duration-300"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                          >
                            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                          </Button>
                        </>
                      </div>
                      <div>
                        <h3 className="text-xl font-black">{user.name}</h3>
                        <p className="text-sm font-bold text-primary flex items-center gap-1.5 mt-0.5">
                          <ShieldCheck className="h-4 w-4" />{user.role}
                        </p>
                        {user.specialty && (
                          <p className="text-xs font-semibold text-muted-foreground mt-1 flex items-center gap-1">
                            <Activity className="h-3 w-3 text-primary/60" />{user.specialty}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Mail className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Email Address</p>
                        <p className="text-sm font-bold">{user.email}</p>
                      </div>
                    </div>

                    {/* Change Password */}
                    {(user.role === "DOCTOR" || user.role === "STAFF") && (
                      <ChangePasswordDialog
                        trigger={
                          <Button variant="outline" className="w-full justify-start gap-3 rounded-xl border-primary/20 hover:bg-primary/5 transition-all">
                            <Lock className="h-4 w-4" />
                            Change My Password
                          </Button>
                        }
                      />
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Bottom Controls */}
          <div className={cn("flex items-center gap-2", isCollapsed ? "flex-col w-full" : "flex-row w-full")}>
            <div className={cn(isCollapsed ? "w-10 h-10" : "flex-1")}>
              <ModeToggle className={cn(isCollapsed ? "" : "w-full h-10")} />
            </div>

            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="icon"
                    className={cn(
                      "rounded-xl border-rose-500/20 text-rose-500",
                      "hover:bg-rose-500 hover:text-white hover:border-rose-500 hover:shadow-lg hover:shadow-rose-500/20",
                      "transition-all duration-300",
                      isCollapsed ? "w-10 h-10" : "h-10 flex-1 px-4"
                    )}
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    {!isCollapsed && <span className="ml-2 font-bold text-xs uppercase tracking-wider">Logout</span>}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={isCollapsed ? "right" : "top"}><p>Logout</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
