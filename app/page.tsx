"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Users, FileText, Activity, Clock, Loader2, Calendar,
  ChevronRight, Building, TrendingUp, TrendingDown, Minus,
  ArrowRight, Zap, Heart, BarChart3, Sparkles,
} from "lucide-react"
import { DiagnosisChart } from "@/components/diagnosis-chart"
import { RecentPatientsTable } from "@/components/recent-patients-table"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SuperAdminPatientTrends } from "@/components/super-admin-patient-trends"
import { SuperAdminAppointmentTrends } from "@/components/super-admin-appointment-trends"
import { motion } from "framer-motion"

import { StatCard, ColorScheme } from "@/components/ui/stat-card"

// ── Metric Card Config ───────────────────────────────────────────────────────
const METRIC_CARDS: {
  id: string
  label: string
  icon: any
  href: string
  colorScheme: ColorScheme
}[] = [
  {
    id: "patients",
    label: "Total Patients",
    icon: Users,
    href: "/patients",
    colorScheme: "violet",
  },
  {
    id: "newPatients",
    label: "New Patients",
    icon: Activity,
    href: "/patients",
    colorScheme: "cyan",
  },
  {
    id: "reports",
    label: "Total Reports",
    icon: FileText,
    href: "/patients",
    colorScheme: "amber",
  },
  {
    id: "imaging",
    label: "Pending Imaging",
    icon: Clock,
    href: "/imaging",
    colorScheme: "rose",
  },
]

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState({
    totalPatients: 0,
    newPatients: 0,
    lastMonthPatients: 0,
    patientsGrowthPct: 0,
    totalReports: 0,
    reportsThisMonth: 0,
    pendingImaging: 0,
    totalImaging: 0,
    todayTotal: 0,
    todayCompleted: 0,
    nextAppointment: null as any,
    isSuperAdmin: false,
    isAdmin: false,
    selectedHospitalName: "",
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const meRes = await fetch("/api/auth/me")
        const meData = await meRes.json()
        const normalizedRole = String(meData?.user?.role || "").toUpperCase().trim()

        const [patientsRes, reportsRes, imagingRes, appointmentsRes] = await Promise.all([
          fetch("/api/patients"),
          fetch("/api/reports"),
          fetch("/api/imaging"),
          fetch("/api/appointments"),
        ])
        const patients = patientsRes.ok ? await patientsRes.json() : []
        const reports = reportsRes.ok ? await reportsRes.json() : []
        const imaging = imagingRes.ok ? await imagingRes.json() : []
        const appointments = appointmentsRes.ok ? await appointmentsRes.json() : []

        const now = new Date()
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
        const todayAppts = Array.isArray(appointments)
          ? appointments.filter((a: any) => a.date === todayStr)
          : []

        const upcomingAppts = todayAppts
          .filter((a: any) => {
            if (a.status === "Cancelled" || a.status === "Completed" || !a.time) return false
            const [hours, minutes] = a.time.split(":").map(Number)
            const apptTime = new Date()
            apptTime.setHours(hours, minutes, 0, 0)
            return apptTime > now
          })
          .sort((a: any, b: any) => a.time.localeCompare(b.time))

        const patientsList = Array.isArray(patients) ? patients : []
        const reportsList = Array.isArray(reports) ? reports : []
        const imagingList = Array.isArray(imaging) ? imaging : []

        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

        const thisMonthPatients = patientsList.filter((p: any) => {
          const createdDate = p.created_at || p.createdAt ? new Date(p.created_at || p.createdAt) : null
          return createdDate && !isNaN(createdDate.getTime()) && createdDate >= startOfThisMonth
        }).length

        const lastMonthPatients = patientsList.filter((p: any) => {
          const createdDate = p.created_at || p.createdAt ? new Date(p.created_at || p.createdAt) : null
          return createdDate && !isNaN(createdDate.getTime()) && createdDate >= startOfLastMonth && createdDate < startOfThisMonth
        }).length

        const reportsThisMonth = reportsList.filter((r: any) => {
          const reportDate = r.created_at || r.date ? new Date(r.created_at || r.date) : null
          return reportDate && !isNaN(reportDate.getTime()) && reportDate >= startOfThisMonth
        }).length

        const pendingImaging = imagingList.filter((i: any) => {
          const flag = String(i.ai_flag || i.aiFlag || "").toLowerCase()
          return flag.includes("requires review") || flag.includes("pending")
        }).length

        const patientsGrowthPct =
          lastMonthPatients > 0
            ? Math.round(((thisMonthPatients - lastMonthPatients) / lastMonthPatients) * 100)
            : thisMonthPatients > 0 ? 100 : 0

        setStats({
          totalPatients: patientsList.length,
          newPatients: thisMonthPatients,
          lastMonthPatients,
          patientsGrowthPct,
          totalReports: reportsList.length,
          reportsThisMonth,
          pendingImaging,
          totalImaging: imagingList.length,
          todayTotal: todayAppts.length,
          todayCompleted: todayAppts.filter((a: any) => a.status === "Completed").length,
          nextAppointment: upcomingAppts[0] || null,
          isSuperAdmin: normalizedRole === "SUPER_ADMIN",
          isAdmin: normalizedRole === "ADMIN",
          selectedHospitalName: meData.user?.hospital_name || "",
        })
      } catch (error) {
        console.error("Failed to fetch stats:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const completionPct = stats.todayTotal > 0 ? (stats.todayCompleted / stats.todayTotal) * 100 : 0

  return (
    <main className="relative flex-1 min-h-screen overflow-x-hidden overflow-y-auto">
      {/* ── Ambient Background ── */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* Radial gradient base */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 20% -10%, oklch(0.55 0.22 285 / 0.10) 0%, transparent 60%)," +
              "radial-gradient(ellipse 60% 50% at 80% 80%, oklch(0.62 0.18 200 / 0.08) 0%, transparent 60%)," +
              "oklch(0.97 0.005 250)",
          }}
        />
        {/* Blobs */}
        <div className="blob blob-violet" style={{ top: "-8%", left: "-5%" }} />
        <div className="blob blob-cyan" style={{ bottom: "15%", right: "5%" }} />
        <div className="blob blob-indigo" style={{ top: "40%", left: "50%" }} />
      </div>
      {/* Dark mode override */}
      <style>{`
        .dark main { background: oklch(0.12 0.025 270); }
      `}</style>

      <div className="container mx-auto relative py-8 md:py-10 px-4 md:px-8">
        <PageHeader
          title={stats.isSuperAdmin && stats.selectedHospitalName ? `Dashboard — ${stats.selectedHospitalName}` : "Dashboard"}
          description="Welcome back! Here's what's happening at your clinic today."
          showSearch
          badge="Live"
        />

        {/* ── Super Admin Hospital Banner ── */}
        {stats.isSuperAdmin && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-8 p-5 rounded-3xl glass-premium border border-primary/15 overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/8 to-violet-600/5 pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-violet-500 to-cyan-500 opacity-60" />
            <div className="flex flex-col md:flex-row items-center justify-between gap-5 relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/15 rounded-2xl shadow-inner">
                  <Building className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary/70" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">Super Admin</span>
                  </div>
                  <h3 className="text-lg font-black text-foreground">Hospital Management</h3>
                  <p className="text-sm font-medium text-muted-foreground">Onboard new facilities and manage existing healthcare centers.</p>
                </div>
              </div>
              <Button
                onClick={() => router.push("/super-admin/hospitals")}
                className={cn(
                  "rounded-2xl h-11 px-7 font-black text-xs uppercase tracking-widest",
                  "bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90",
                  "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30",
                  "hover:scale-[1.02] active:scale-[0.98] transition-all duration-200",
                  "border-0"
                )}
              >
                Go to Hospital Center
                <ChevronRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Metric Cards ── */}
        <motion.div
           variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          initial="hidden"
          animate="show"
          className="grid gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6 md:mb-8"
        >
          {METRIC_CARDS.map((card, i) => (
            <StatCard
              key={card.id}
              label={card.label}
              value={
                card.id === "patients" ? stats.totalPatients.toLocaleString() :
                card.id === "newPatients" ? stats.newPatients.toLocaleString() :
                card.id === "reports" ? stats.totalReports.toLocaleString() :
                stats.pendingImaging
              }
              icon={card.icon}
              loading={loading}
              colorScheme={card.colorScheme}
              onClick={() => router.push(card.href)}
              idx={i}
              subValue={
                card.id === "patients" ? `${stats.patientsGrowthPct >= 0 ? "+" : ""}${stats.patientsGrowthPct}%` :
                card.id === "imaging" ? (stats.totalImaging > 0 ? `${Math.round((stats.pendingImaging / stats.totalImaging) * 100)}% backlog` : "No backlog") :
                undefined
              }
              subLabel={
                card.id === "patients" ? `vs last month (${stats.lastMonthPatients})` :
                card.id === "newPatients" ? "Added this month" :
                card.id === "reports" ? `${stats.reportsThisMonth} added this month` :
                undefined
              }
            />
          ))}
        </motion.div>

        {/* ── Charts & Widgets Row ── */}
        <div className="grid gap-5 lg:grid-cols-3 mb-6">
          {/* Diagnosis Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={cn(stats.isSuperAdmin || stats.isAdmin ? "lg:col-span-1" : "lg:col-span-2")}
          >
            <div className="glass-premium rounded-3xl p-6 md:p-8 h-full hover:shadow-2xl transition-all duration-400 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-cyan-500 rounded-t-3xl opacity-50" />
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="h-4 w-4 text-primary/70" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">Analytics</span>
                </div>
                <h3 className="text-xl font-black text-foreground">Diagnosis Distribution</h3>
                <p className="text-sm font-medium text-muted-foreground mt-0.5">Insights from current patient profiles</p>
              </div>
              <div className="h-[340px]">
                <DiagnosisChart />
              </div>
            </div>
          </motion.div>

          {/* Right Panel: Super Admin Trends OR Clinical Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={cn(stats.isSuperAdmin || stats.isAdmin ? "lg:col-span-2" : "lg:col-span-1")}
          >
            {stats.isSuperAdmin || stats.isAdmin ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 h-full">
                <SuperAdminPatientTrends />
                <SuperAdminAppointmentTrends />
              </div>
            ) : (
              <div className="glass-premium rounded-3xl h-full flex flex-col overflow-hidden relative">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-emerald-500 rounded-t-3xl opacity-50" />
                {/* Header */}
                <div className="p-6 border-b border-border/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Heart className="h-4 w-4 text-emerald-500/80" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70 dark:text-emerald-400/70">Live</span>
                      </div>
                      <h3 className="text-xl font-black text-foreground">Clinical Overview</h3>
                    </div>
                    <div className="p-2.5 bg-emerald-500/10 rounded-2xl text-emerald-500">
                      <Activity className="h-5 w-5 animate-pulse" />
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-5 flex-1 flex flex-col justify-between">
                  {/* Today's Progress */}
                  <div className="rounded-2xl bg-gradient-to-br from-emerald-500/8 to-cyan-500/5 border border-emerald-500/15 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">
                          Today's Progress
                        </p>
                        <h4 className="text-3xl font-black text-foreground">
                          {stats.todayCompleted}
                          <span className="text-muted-foreground/50 font-medium text-lg">/{stats.todayTotal}</span>
                        </h4>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Done</p>
                        <p className="text-2xl font-black text-foreground">{Math.round(completionPct)}%</p>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-500 transition-all duration-1000 ease-out"
                        style={{
                          width: `${completionPct}%`,
                          boxShadow: completionPct > 0 ? "0 0 10px oklch(0.7 0.18 200 / 0.4)" : undefined
                        }}
                      />
                    </div>
                  </div>

                  {/* Next Patient */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-60" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
                      </span>
                      <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                        Next Patient
                      </p>
                    </div>
                    {stats.nextAppointment ? (
                      <div
                        className={cn(
                          "p-4 rounded-2xl cursor-pointer group/next transition-all duration-300",
                          "bg-gradient-to-br from-indigo-500/10 to-violet-500/5",
                          "border border-indigo-500/15 hover:border-indigo-500/35",
                          "hover:shadow-md hover:shadow-indigo-500/10"
                        )}
                        onClick={() => router.push(`/patients/${stats.nextAppointment.patient_id}`)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-black text-foreground group-hover/next:text-indigo-600 dark:group-hover/next:text-indigo-400 transition-colors">
                            {stats.nextAppointment.patient_name}
                          </span>
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg">
                            {stats.nextAppointment.time}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/80">
                            <Calendar className="h-3 w-3" />
                            {stats.nextAppointment.type}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/80">
                            <Zap className="h-3 w-3" />
                            {stats.nextAppointment.specialty || "General"}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 rounded-2xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center text-center">
                        <div className="p-3 bg-muted/50 rounded-2xl mb-2.5 text-muted-foreground/50">
                          <Clock className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-bold text-muted-foreground/70">No more appointments today</p>
                        <p className="text-xs text-muted-foreground/40 mt-0.5">You're all caught up!</p>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => router.push("/appointments")}
                    className={cn(
                      "w-full h-11 rounded-2xl font-black text-xs uppercase tracking-widest",
                      "bg-gradient-to-r from-slate-900 to-slate-800 dark:from-white dark:to-slate-100",
                      "text-white dark:text-slate-900",
                      "hover:shadow-xl hover:shadow-slate-900/15 dark:hover:shadow-white/10",
                      "hover:scale-[1.01] active:scale-[0.99] transition-all duration-200",
                      "border-0"
                    )}
                  >
                    View Full Schedule
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* ── Recent Patients Table ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass-premium rounded-3xl overflow-hidden relative"
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-violet-500 to-cyan-500 opacity-50" />
          <div className="p-6 md:p-8 border-b border-border/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-primary/70" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">Registry</span>
                </div>
                <h3 className="text-xl font-black text-foreground">Recent Patients</h3>
                <p className="text-sm font-medium text-muted-foreground mt-0.5">Chronological overview of latest admissions</p>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push("/patients")}
                className={cn(
                  "rounded-xl h-9 px-4 font-bold text-xs gap-1.5",
                  "border-primary/20 text-primary hover:bg-primary/8 hover:border-primary/40",
                  "transition-all duration-200"
                )}
              >
                View All
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="p-4 md:p-8 overflow-x-auto">
            <RecentPatientsTable />
          </div>
        </motion.div>
      </div>
    </main>
  )
}
