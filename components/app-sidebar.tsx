"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  LayoutDashboard,
  Users,
  Search,
  FolderTree,
  FileImage,
  Settings,
  Activity,
  Calendar,
  CreditCard,
  FlaskConical,
  Pill,
  ClipboardList,
  MessageSquare,
  LogOut,
  ShieldCheck,
  BarChart,
  User as UserIcon,
  Mail,
  Building,
  Lock,
  Camera,
  Loader2,
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
  },
  {
    title: "OPD",
    href: "/opd",
    icon: ClipboardList,
    roles: ["STAFF", "ADMIN"],
  },
  {
    title: "OPD List",
    href: "/opd-list",
    icon: ClipboardList,
    roles: ["STAFF", "ADMIN", "DOCTOR"],
  },
  {
    title: "Appointments",
    href: "/appointments",
    icon: Calendar,
    roles: ["ADMIN", "DOCTOR", "STAFF"],
  },
  {
    title: "Patients",
    href: "/patients",
    icon: Users,
    roles: ["ADMIN", "DOCTOR", "STAFF"],
  },
  {
    title: "Doctors",
    href: "/doctors",
    icon: Users,
    roles: ["ADMIN"],
  },
  {
    title: "Specialties",
    href: "/specialties",
    icon: ClipboardList,
    roles: ["ADMIN"],
  },
  {
    title: "Lab Results",
    href: "/lab-results",
    icon: FlaskConical,
    roles: ["ADMIN", "DOCTOR"],
  },
  {
    title: "Prescriptions",
    href: "/prescriptions",
    icon: Pill,
    roles: ["ADMIN", "DOCTOR"],
  },
  {
    title: "Billing & Invoices",
    href: "/billing",
    icon: CreditCard,
    roles: ["ADMIN", "STAFF"],
  },
  {
    title: "Medical Records",
    href: "/medical-records",
    icon: ClipboardList,
    roles: ["ADMIN", "DOCTOR"],
  },
  {
    title: "Imaging",
    href: "/imaging",
    icon: FileImage,
    roles: ["ADMIN", "DOCTOR"],
  },

  {
    title: "System Settings",
    href: "/settings",
    icon: Settings,
    roles: ["ADMIN"],
  },
  {
    title: "Hospitals",
    href: "/super-admin/hospitals",
    icon: Building,
    roles: ["SUPER_ADMIN"],
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
      
      const uploadRes = await fetch("/api/auth/profile/image", {
        method: "POST",
        body: formData,
      })
      
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed")

      const imageUrl = uploadData.imageUrl || uploadData.url

      setUser({ ...user, image: imageUrl })
      toast.success("Profile image updated successfully")
    } catch (error: any) {
      console.error("Image upload error:", error)
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

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar shadow-xl">
      <SidebarHeader className={cn(
        "h-auto py-5 border-b border-sidebar-border/50 px-4 bg-linear-to-b from-sidebar-accent/30 to-transparent transition-all duration-300",
        state === "collapsed" && "px-2 py-4"
      )}>
        <div className={cn(
          "flex items-center group transition-all duration-300",
          state === "collapsed" ? "justify-center" : "justify-between gap-3.5"
        )}>
          <Link href="/" className="flex items-center gap-3.5 cursor-pointer hover:opacity-90 transition-opacity">
            <div className={cn(
              "bg-linear-to-br from-primary/20 to-primary/5 rounded-2xl shrink-0 shadow-lg shadow-primary/5 border border-primary/10 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-primary/10 flex items-center justify-center",
              state === "collapsed" ? "w-8 h-8 p-1.5" : "p-2.5"
            )}>
              <Activity className={cn("text-primary", state === "collapsed" ? "h-4 w-4" : "h-5 w-5")} />
            </div>
            {state === "expanded" && (
              <div className="flex flex-col min-w-0 animate-in fade-in duration-500">
                <span className="text-[18px] font-black uppercase tracking-[0.2em] text-[#e05d38] mb-0.5 drop-shadow-sm">
                  Appointment
                </span>
                <span className="text-sm font-black tracking-tight text-sidebar-foreground leading-none whitespace-normal mb-1.5" title="Doctor's Appointments">
                  Management System
                </span>
                {user?.role !== "SUPER_ADMIN" && user?.hospital_name && (
                  <div className="flex items-center gap-1.5">
                    <div className="h-px w-4 bg-primary/30" />
                    <span className="text-[9px] font-bold text-muted-foreground/80 uppercase tracking-wider whitespace-normal" title={`Supported by ${user.hospital_name}`}>
                      {user.hospital_name}
                    </span>
                  </div>
                )}
              </div>
            )}
          </Link>
          {state === "expanded" && (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarTrigger className="h-8 w-8 rounded-lg border border-sidebar-border/50 bg-sidebar-accent/50 hover:bg-primary/10 hover:text-primary transition-all duration-300 mb-12 ml-1" />
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Collapse Sidebar</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {state === "collapsed" && (
          <div className="flex justify-center mt-2">
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarTrigger className="h-8 w-8 rounded-lg border border-sidebar-border/50 bg-sidebar-accent/50 hover:bg-primary/10 hover:text-primary transition-all duration-300" />
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Expand Sidebar</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className={cn(
        "transition-all duration-300",
        state === "collapsed" ? "p-2" : "p-4"
      )}>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 w-full animate-pulse bg-sidebar-accent/50 rounded-xl" />
            ))}
          </div>
        ) : (
          <SidebarMenu className="space-y-1">
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.title}
                    className={cn(
                      "flex items-center gap-3 rounded-xl py-2.5 text-sm font-semibold transition-all duration-300 group",
                      state === "collapsed" ? "justify-center px-0 w-10 h-10 mx-auto" : "px-3",
                      isActive
                        ? "bg-primary/10 text-primary border border-primary/20 shadow-sm shadow-primary/5 scale-[1.02]"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground hover:translate-x-0.5",
                    )}
                  >
                    <Link href={item.href} className="flex items-center w-full gap-3">
                      <Icon className={cn(
                        "transition-all duration-300",
                        state === "collapsed" ? "h-5 w-5" : "h-4.5 w-4.5",
                        isActive ? "text-primary scale-110" : "text-primary/60 group-hover:text-primary"
                      )} />
                      {state === "expanded" && (
                        <span className={cn(
                          "transition-colors duration-300",
                          isActive ? "text-primary" : "text-sidebar-foreground/70 group-hover:text-sidebar-foreground"
                        )}>
                          {item.title}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        )}
      </SidebarContent>

      <SidebarFooter className={cn(
        "border-t border-sidebar-border transition-all duration-300",
        state === "collapsed" ? "p-1.5 gap-2" : "p-4 gap-4"
      )}>
        <div className={cn(
          "flex items-center",
          state === "collapsed" ? "flex-col gap-2" : "flex-col gap-3"
        )}>
          {user && (
            <Dialog>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "flex items-center justify-start gap-3 h-auto py-2 px-3 rounded-xl border-sidebar-border/50 bg-sidebar-accent/50 hover:bg-primary/10 hover:border-primary/30 transition-all duration-300 group",
                          state === "collapsed" ? "w-10 h-10 p-0 justify-center" : "w-full"
                        )}
                      >
                        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-primary/20 shadow-inner group-hover:text-primary">
                          {profileImage ? (
                            <img src={profileImage} alt={user.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                              {user.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        {state === "expanded" && (
                            <div className="flex flex-col items-start min-w-0 text-left animate-in fade-in slide-in-from-left-2 duration-300">
                              <span className="text-sm font-bold text-sidebar-foreground truncate w-full group-hover:text-primary">
                                {user.name}
                              </span>
                              <div className="flex items-center gap-1">
                                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider group-hover:text-primary">
                                  {user.role}
                                </span>
                              </div>
                              {user.specialty && (
                                <span className="text-[9px] font-bold text-primary/80 uppercase tracking-tight truncate w-full mt-0.5 group-hover:text-primary animate-in slide-in-from-top-1 duration-300">
                                  {user.specialty}
                                </span>
                              )}
                            </div>
                        )}
                      </Button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  {state === "collapsed" && (
                    <TooltipContent side="right">
                      <p>{user.name} ({user.role}{user.specialty ? ` - ${user.specialty}` : ''})</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
              <DialogContent className="sm:max-w-[425px] glass-premium border-none shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 -z-10 text-primary">
                  <UserIcon className="h-32 w-32 rotate-12" />
                </div>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black">User Profile</DialogTitle>
                  <DialogDescription className="font-medium text-muted-foreground">
                    Your account details and permissions
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-6 space-y-6">
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                    <div className="relative group/avatar">
                      <Avatar className="h-20 w-20 border-2 border-primary/20 shadow-xl transition-all duration-300 group-hover/avatar:border-primary/40">
                        <AvatarImage src={profileImage} className="object-cover" />
                        <AvatarFallback className="bg-primary/10 text-primary text-2xl font-black">
                          {user.name.substring(0, 2).toUpperCase()}
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
                          {uploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Camera className="h-4 w-4" />
                          )}
                        </Button>
                      </>
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-foreground">{user.name}</h3>
                      <p className="text-sm font-bold text-primary flex items-center gap-1">
                        <ShieldCheck className="h-4 w-4" />
                        {user.role}
                      </p>
                      {user.specialty && (
                        <p className="text-xs font-bold text-muted-foreground mt-1 flex items-center gap-1">
                           <Activity className="h-3 w-3 text-primary/60" />
                           {user.specialty}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/40 dark:bg-slate-900/40 border border-white/20 dark:border-slate-800">
                      <Mail className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Email Address</p>
                        <p className="text-sm font-bold">{user.email}</p>
                      </div>
                    </div>

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

          <div className={cn(
            "flex items-center gap-2",
            state === "collapsed" ? "flex-col w-full" : "flex-row w-full"
          )}>
            <div className={cn(state === "expanded" ? "flex-1" : "w-10 h-10")}>
              <ModeToggle className={cn(state === "expanded" && "w-full h-12")} />
            </div>

            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="icon"
                    className={cn(
                      "rounded-xl border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all duration-300 shadow-sm",
                      state === "collapsed" ? "w-10 h-10" : "h-12 flex-1"
                    )}
                  >
                    <LogOut className="h-4 w-4" />
                    {state === "expanded" && <span className="ml-2 font-bold text-xs uppercase tracking-wider">Logout</span>}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={state === "collapsed" ? "right" : "top"}>
                  <p>Logout</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
