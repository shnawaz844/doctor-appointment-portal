"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, Activity, Clock, Loader2, Calendar, ChevronRight, Building } from "lucide-react"
import { DiagnosisChart } from "@/components/diagnosis-chart"
import { RecentPatientsTable } from "@/components/recent-patients-table"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SuperAdminPatientTrends } from "@/components/super-admin-patient-trends"

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
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
        const todayAppts = Array.isArray(appointments) ? appointments.filter((a: any) => a.date === todayStr) : []

        // Sort today's appointments by time to find the next one
        const upcomingAppts = todayAppts
          .filter((a: any) => {
            if (a.status === "Cancelled" || a.status === "Completed") return false
            const [hours, minutes] = a.time.split(':').map(Number)
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
          const rawDate = p.created_at || p.createdAt
          const createdDate = rawDate ? new Date(rawDate) : null
          return createdDate && !Number.isNaN(createdDate.getTime()) && createdDate >= startOfThisMonth
        }).length

        const lastMonthPatients = patientsList.filter((p: any) => {
          const rawDate = p.created_at || p.createdAt
          const createdDate = rawDate ? new Date(rawDate) : null
          return (
            createdDate &&
            !Number.isNaN(createdDate.getTime()) &&
            createdDate >= startOfLastMonth &&
            createdDate < startOfThisMonth
          )
        }).length

        const reportsThisMonth = reportsList.filter((r: any) => {
          const rawDate = r.created_at || r.date
          const reportDate = rawDate ? new Date(rawDate) : null
          return reportDate && !Number.isNaN(reportDate.getTime()) && reportDate >= startOfThisMonth
        }).length

        const pendingImaging = imagingList.filter((i: any) => {
          const flag = String(i.ai_flag || i.aiFlag || "").toLowerCase()
          return flag.includes("requires review") || flag.includes("pending")
        }).length

        const patientsGrowthPct =
          lastMonthPatients > 0 ? Math.round(((thisMonthPatients - lastMonthPatients) / lastMonthPatients) * 100) : thisMonthPatients > 0 ? 100 : 0

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

  return (
    <main className="relative flex-1 min-h-screen overflow-x-hidden overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-blue-900/20">
      {/* Decorative Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="blob top-[-10%] left-[-10%]" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <div className="container mx-auto relative py-6 md:py-10 px-4 md:px-8">
        <PageHeader
          title={stats.isSuperAdmin && stats.selectedHospitalName ? `Dashboard - ${stats.selectedHospitalName}` : "Dashboard"}
          description="Overview of your healthcare system"
          showSearch
        />

        {stats.isSuperAdmin && (
          <div className="mb-8 p-6 rounded-3xl bg-linear-to-r from-primary/20 to-primary/5 border border-primary/20 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-center md:text-left">
                <div className="p-3 bg-primary/20 rounded-2xl">
                  <Building className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Hospital Management</h3>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Onboard new facilities and manage existing healthcare centers.</p>
                </div>
              </div>
              <Button 
                onClick={() => router.push("/super-admin/hospitals")}
                className="rounded-2xl h-12 px-8 font-black text-xs uppercase tracking-widest bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20"
              >
                Go to Hospital Center
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid gap-4 md:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-8 md:mb-10">
          <Card
            className="group relative overflow-hidden border-none bg-blue-500/10 dark:bg-blue-600/20 backdrop-blur-xl border-t border-l border-white/40 dark:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 cursor-pointer"
            onClick={() => router.push("/patients")}
          >
            <div className="absolute inset-0 bg-linear-to-br from-blue-500/20 via-blue-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-[0.2em]">Total Patients</CardTitle>
              <div className="p-2.5 bg-blue-500/20 dark:bg-blue-400/20 rounded-xl group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-lg shadow-blue-500/20">
                <Users className="h-5 w-5 text-blue-700 dark:text-blue-300 group-hover:text-white transition-colors" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10 pt-4">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <>
                  <div className="text-4xl font-black tracking-tight text-blue-900 dark:text-white group-hover:translate-x-1 transition-transform duration-500">{stats.totalPatients.toLocaleString()}</div>
                  <div className="flex items-center mt-3">
                    <span className="text-[10px] font-bold text-blue-700 dark:text-blue-100 bg-blue-500/10 dark:bg-blue-400/10 px-2 py-1 rounded-lg border border-blue-200/50 dark:border-blue-700/50">
                      {stats.patientsGrowthPct >= 0 ? "+" : ""}{stats.patientsGrowthPct}%
                    </span>
                    <span className="text-[11px] font-medium text-blue-700/70 dark:text-blue-300/70 ml-2">
                      vs last month ({stats.lastMonthPatients})
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card
            className="group relative overflow-hidden border-none bg-emerald-500/10 dark:bg-emerald-600/20 backdrop-blur-xl border-t border-l border-white/40 dark:border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-500 cursor-pointer"
            onClick={() => router.push("/patients")}
          >
            <div className="absolute inset-0 bg-linear-to-br from-emerald-500/20 via-emerald-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-[0.2em]">New Patients</CardTitle>
              <div className="p-2.5 bg-emerald-500/20 dark:bg-emerald-400/20 rounded-xl group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500 shadow-lg shadow-emerald-500/20">
                <Activity className="h-5 w-5 text-emerald-700 dark:text-emerald-300 group-hover:text-white transition-colors" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10 pt-4">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <>
                  <div className="text-4xl font-black tracking-tight text-emerald-900 dark:text-white group-hover:translate-x-1 transition-transform duration-500">{stats.newPatients.toLocaleString()}</div>
                  <div className="flex items-center mt-3 text-[11px] font-medium text-emerald-700/70 dark:text-emerald-300/70">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    Added in current month
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card
            className="group relative overflow-hidden border-none bg-amber-500/10 dark:bg-amber-600/20 backdrop-blur-xl border-t border-l border-white/40 dark:border-amber-500/30 hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-500 cursor-pointer"
            onClick={() => router.push("/patients")}
          >
            <div className="absolute inset-0 bg-linear-to-br from-amber-500/20 via-amber-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-[0.2em]">Total Reports</CardTitle>
              <div className="p-2.5 bg-amber-500/20 dark:bg-amber-400/20 rounded-xl group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all duration-500 shadow-lg shadow-amber-500/20">
                <FileText className="h-5 w-5 text-amber-700 dark:text-amber-300 group-hover:text-white transition-colors" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10 pt-4">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <>
                  <div className="text-4xl font-black tracking-tight text-amber-900 dark:text-white group-hover:translate-x-1 transition-transform duration-500">{stats.totalReports.toLocaleString()}</div>
                  <p className="text-[11px] font-medium text-amber-700/70 dark:text-amber-300/70 mt-3">
                    {stats.reportsThisMonth} added this month
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card
            className="group relative overflow-hidden border-none bg-rose-500/10 dark:bg-rose-600/20 backdrop-blur-xl border-t border-l border-white/40 dark:border-rose-500/30 hover:shadow-2xl hover:shadow-rose-500/20 transition-all duration-500 cursor-pointer"
            onClick={() => router.push("/imaging")}
          >
            <div className="absolute inset-0 bg-linear-to-br from-rose-500/20 via-rose-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-[0.2em]">Pending Imaging</CardTitle>
              <div className="p-2.5 bg-rose-500/20 dark:bg-rose-400/20 rounded-xl group-hover:scale-110 group-hover:bg-rose-600 group-hover:text-white transition-all duration-500 shadow-lg shadow-rose-500/20">
                <Clock className="h-5 w-5 text-rose-700 dark:text-rose-300 group-hover:text-white transition-colors" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10 pt-4">
              <div className="text-4xl font-black tracking-tight text-rose-900 dark:text-white group-hover:translate-x-1 transition-transform duration-500">{stats.pendingImaging}</div>
              <div className="flex items-center mt-3">
                <span className="text-[10px] font-bold text-rose-700 dark:text-rose-100 bg-rose-500/20 dark:bg-rose-400/10 px-3 py-1 rounded-lg border border-rose-200/50 dark:border-rose-700/50 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  {stats.totalImaging > 0 ? `${Math.round((stats.pendingImaging / stats.totalImaging) * 100)}% backlog` : "No backlog"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Tables */}
        <div className="grid gap-8 lg:grid-cols-3 mb-10">
          <div className={cn(stats.isSuperAdmin || stats.isAdmin ? "lg:col-span-1" : "lg:col-span-2")}>
            <div className="glass-premium rounded-3xl p-8 hover:shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-6 duration-1000 h-full">
              <div className="mb-8">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Diagnosis Distribution</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Insights from current patient profiles</p>
              </div>
              <div className="h-[350px]">
                <DiagnosisChart />
              </div>
            </div>
          </div>


          <div className={cn(stats.isSuperAdmin || stats.isAdmin ? "lg:col-span-2" : "lg:col-span-1")}>
            {stats.isSuperAdmin || stats.isAdmin ? (
              <SuperAdminPatientTrends />
            ) : (
              <Card className="border-none glass-premium rounded-3xl animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-150 overflow-hidden group h-full flex flex-col">
                <CardHeader className="pb-2 relative z-10">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-black text-slate-900 dark:text-white">Clinical Overview</CardTitle>
                    <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600">
                      <Activity className="h-5 w-5 animate-pulse" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 relative z-10 flex-1 flex flex-col justify-between">
                  {/* Today's Progress */}
                  <div className="relative p-4 rounded-2xl bg-slate-900/5 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 overflow-hidden">
                    <div className="absolute inset-0 bg-linear-to-br from-emerald-500/5 to-transparent opacity-50" />
                    <div className="relative z-10 flex items-center justify-between mb-4">
                      <div>
                        <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Today's Progress</p>
                        <h4 className="text-2xl font-black text-slate-900 dark:text-white">
                          {stats.todayCompleted}<span className="text-slate-400 font-medium">/{stats.todayTotal}</span>
                        </h4>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Consultations</p>
                        <p className="text-xs font-black text-slate-900 dark:text-white">
                          {stats.todayTotal > 0 ? Math.round((stats.todayCompleted / stats.todayTotal) * 100) : 0}% Done
                        </p>
                      </div>
                    </div>
                    {/* Micro Progress Bar */}
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                        style={{ width: `${stats.todayTotal > 0 ? (stats.todayCompleted / stats.todayTotal) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Next Patient */}
                  <div>
                    <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
                      Next Patient
                    </p>
                    {stats.nextAppointment ? (
                      <div className="p-4 rounded-2xl bg-linear-to-br from-blue-500/10 to-purple-500/5 border border-blue-500/20 group/next hover:border-blue-500/40 transition-all cursor-pointer" onClick={() => router.push(`/patients/${stats.nextAppointment.patient_id}`)}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-black text-slate-900 dark:text-white group-hover/next:text-blue-600 transition-colors">{stats.nextAppointment.patient_name}</span>
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">
                            {stats.nextAppointment.time}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            <Calendar className="h-3 w-3" />
                            {stats.nextAppointment.type}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            <Clock className="h-3 w-3" />
                            {stats.nextAppointment.specialty || "General"}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center text-center">
                        <div className="p-2 bg-slate-100 dark:bg-white/5 rounded-full mb-2 text-slate-400">
                          <Clock className="h-4 w-4" />
                        </div>
                        <p className="text-[11px] font-bold text-slate-500">No more appointments scheduled today</p>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => router.push("/appointments")}
                    className="w-full h-12 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-slate-900/10 dark:shadow-white/5"
                  >
                    View Full Schedule
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Recent Patients */}
        <div className="glass-premium rounded-3xl p-4 md:p-8 hover:shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300 overflow-x-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Recent Patients</h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Chronological overview of latest admissions</p>
            </div>
          </div>
          <RecentPatientsTable />
        </div>
      </div>
    </main>
  )
}

