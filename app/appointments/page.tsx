"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Calendar, Clock, Loader2, RotateCcw, Video, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CreateAppointmentDialog } from "@/components/create-appointment-dialog"
import { EditAppointmentDialog } from "@/components/edit-appointment-dialog"
import { CreatePrescriptionDialog } from "@/components/create-prescription-dialog"
import { StatCard } from "@/components/ui/stat-card"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { formatPhoneWithPrefix } from "@/lib/phone"
import { PageHeader } from "@/components/page-header"
import { supabase } from "@/lib/supabase"


export default function AppointmentsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [doctors, setDoctors] = useState<any[]>([])
  const [specialties, setSpecialties] = useState<any[]>([])
  const [filterDoctor, setFilterDoctor] = useState("all")
  const [filterMonth, setFilterMonth] = useState("all")
  const [filterYear, setFilterYear] = useState("all")
  const [filterDate, setFilterDate] = useState("")
  const [activeTab, setActiveTab] = useState("today") // "all" | "today"
  const [currentPage, setCurrentPage] = useState(1)
  const [mounted, setMounted] = useState(false)
  const [patientSearch, setPatientSearch] = useState("")
  const [isProcessingEmergency, setIsProcessingEmergency] = useState<string | null>(null)
  const itemsPerPage = 8

  const checkIsOnline = (a: any) => {
    return (a.type !== "OPD" && a.type === "Online Consultation") ||
      a.type === "Online OPD" ||
      a.type === "Emergency" ||
      (a.type !== "OPD" && (
        a.notes?.includes("[Online Booking]") ||
        a.notes?.includes("[Booked From MOBILE APP]") ||
        a.notes?.includes("Online Teleconsultation") ||
        a.notes?.includes("Online appointment")
      ))
  }

  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const fetchAppointments = async () => {
    try {
      const [apptsRes, meRes, docsRes, specsRes] = await Promise.all([
        fetch(`/api/appointments?t=${Date.now()}`),
        fetch(`/api/auth/me?t=${Date.now()}`),
        fetch(`/api/doctors?t=${Date.now()}`),
        fetch(`/api/specialties?t=${Date.now()}`)
      ])
      const apptsData = await apptsRes.json()
      const meData = await meRes.json()
      const docsData = await docsRes.json()
      const specsData = await specsRes.json()

      setAppointments(Array.isArray(apptsData) ? apptsData : [])
      if (meRes.ok) setUser(meData.user)
      setDoctors(Array.isArray(docsData) ? docsData : [])
      setSpecialties(Array.isArray(specsData) ? specsData : [])
    } catch (error) {
      console.error("Failed to fetch appointments data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    fetchAppointments()

    // Read tab from URL
    const tabParam = searchParams.get("tab")
    if (tabParam) {
      setActiveTab(tabParam)
    }

    // Read patient param from OPD redirect
    const patientParam = searchParams.get("patient")
    if (patientParam) {
      setPatientSearch(patientParam)
      setActiveTab("all")
    }
  }, [])

  // Real-time synchronization for the appointments table
  useEffect(() => {
    if (!user || user.role !== "DOCTOR" || !user.doctor_id) return

    const doctorId = String(user.doctor_id)
    console.log(`[AppointmentsPage] Subscribing to real-time changes for doctor: ${doctorId}`)

    const channel = supabase
      .channel(`appointments-page-${doctorId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `doctor_id=eq.${doctorId}`,
        },
        (payload) => {
          console.log("[AppointmentsPage] Real-time change detected:", payload.eventType, (payload.new as any)?.id || (payload.old as any)?.id)
          fetchAppointments()
        }
      )
      .subscribe((status) => {
        console.log(`[AppointmentsPage] Sync status for doctor ${doctorId}:`, status)
      })

    return () => {
      console.log(`[AppointmentsPage] Cleaning up sync for doctor ${doctorId}`)
      supabase.removeChannel(channel)
    }
  }, [user])

  const changeTab = (newTab: string) => {
    setActiveTab(newTab)
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", newTab)
    router.push(`/appointments?${params.toString()}`, { scroll: false })
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/appointments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id, status: newStatus }),
      })
      if (res.ok) {
        await fetchAppointments()
        router.refresh()
      }
    } catch (error) {
      console.error("Failed to update appointment status:", error)
    }
  }

  const handleRescheduleAction = async (apt: any, action: 'approve' | 'reject') => {
    try {
      const updateData: any = {
        id: apt.id || apt._id,
      }

      if (action === 'approve') {
        updateData.date = apt.reschedule_requested_date
        updateData.time = apt.reschedule_requested_time
        updateData.reschedule_status = 'approved'
      } else {
        updateData.reschedule_status = 'rejected'
        updateData.reschedule_requested_date = null
        updateData.reschedule_requested_time = null
      }

      const res = await fetch("/api/appointments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      if (res.ok) {
        await fetchAppointments()
        router.refresh()
      }
    } catch (error) {
      console.error(`Failed to ${action} reschedule:`, error)
    }
  }

  const handleEmergencyAction = async (apt: any, action: 'approve' | 'reject') => {
    const aptId = apt.id || apt._id;
    try {
      setIsProcessingEmergency(`${aptId}-${action}`);
      const res = await fetch("/api/appointments/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: aptId, action }),
      });

      if (res.ok) {
        await fetchAppointments();
        router.refresh();
      } else {
        console.error("Emergency action failed", await res.json());
      }
    } catch (error) {
      console.error(`Failed to execute emergency action:`, error);
    } finally {
      setIsProcessingEmergency(null);
    }
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [filterDoctor, filterMonth, filterYear, filterDate, activeTab])

  const filteredAppointments = appointments.filter(a => {
    let match = true
    if (filterDoctor !== "all" && a.doctor !== filterDoctor) match = false

    const isOnline = checkIsOnline(a)

    if (activeTab === "today" && (a.date !== today || isOnline)) match = false
    if (activeTab === "all" && isOnline) match = false

    if (activeTab === "online" && (!isOnline || a.date !== today)) match = false
    if (activeTab === "allOnline" && !isOnline) match = false

    if (filterDate && a.date !== filterDate) match = false

    if (filterMonth !== "all" && a.date) {
      const month = a.date.split("-")[1]
      if (month !== filterMonth) match = false
    }

    if (filterYear !== "all" && a.date) {
      const year = a.date.split("-")[0]
      if (year !== filterYear) match = false
    }

    // Patient search from OPD redirect
    if (patientSearch) {
      const term = patientSearch.toLowerCase()
      const nameMatch = a.patient_name?.toLowerCase().includes(term)
      if (!nameMatch) match = false
    }

    return match
  })

  const isVideoEnabled = (date: string, time: string) => {
    try {
      if (!date || !time) return false

      // Parse appointment time: "09:30 AM"
      const [timeStr, period] = time.split(' ')
      let [hours, minutes] = timeStr.split(':').map(Number)
      if (period === 'PM' && hours !== 12) hours += 12
      if (period === 'AM' && hours === 12) hours = 0

      // Create appointment date object in local (IST) time
      const apptDate = new Date(`${date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`)

      const now = new Date()
      const diffMs = apptDate.getTime() - now.getTime()
      const diffMins = diffMs / (1000 * 60)

      // Enable only 5 minutes before or if call is ongoing
      return diffMins <= 5
    } catch (e) {
      return false
    }
  }

  const stats = {
    totalToday: appointments.filter(a => a.date === today).length,
    onlineToday: appointments.filter(a => a.date === today && checkIsOnline(a)).length,
    offlineToday: appointments.filter(a => a.date === today && !checkIsOnline(a)).length,
    scheduled: appointments.filter(a => a.status === "Scheduled" || a.status === "Confirmed").length,
    completed: appointments.filter(a => a.status === "Completed").length
  }

  const emergencyAppts = filteredAppointments.filter(a => a.type === "Emergency")
  const regularAppts = filteredAppointments.filter(a => a.type !== "Emergency")

  const totalPages = Math.max(1, Math.ceil(regularAppts.length / itemsPerPage))
  const paginatedAppointments = regularAppts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  if (!mounted) return null

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
          title="Appointments"
          description="Schedule and manage patient appointments"
          badge="Aura Healthcare"
        />

        {/* Patient filter banner — shown when redirected from OPD list */}
        {patientSearch && (
          <div className="flex items-center gap-3 mb-6 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
            <span className="text-emerald-700 dark:text-emerald-400 text-sm font-bold">
              🔍 Showing appointments for patient: <span className="font-black">{patientSearch}</span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-7 px-3 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-lg"
              onClick={() => {
                setPatientSearch("")
                setActiveTab("today")
                router.replace("/appointments")
              }}
            >
              ✕ Clear
            </Button>
          </div>
        )}

        {/* Appointment Stats */}
        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-8 md:mb-10">
          <StatCard
            label="Total Appointments"
            value={stats.totalToday}
            icon={Calendar}
            subLabel="Today"
            colorScheme="blue"
            loading={loading}
          />
          <StatCard
            label="Offline Appts"
            value={stats.offlineToday}
            icon={Clock}
            subLabel="Today's Offline"
            colorScheme="emerald"
            loading={loading}
            onClick={() => {
              changeTab("today")
              setFilterDate("")
              setFilterMonth("all")
              setFilterYear("all")
            }}
          />
          <StatCard
            label="Online Appts"
            value={stats.onlineToday}
            icon={Video}
            subLabel="Today's Online"
            colorScheme="indigo"
            loading={loading}
            onClick={() => {
              changeTab("online")
              setFilterDate("")
              setFilterMonth("all")
              setFilterYear("all")
            }}
          />

          <StatCard
            label="Scheduled"
            value={stats.scheduled}
            icon={Loader2}
            subLabel="All Upcoming"
            colorScheme="violet"
            loading={loading}
          />
          <StatCard
            label="Completed"
            value={stats.completed}
            icon={RotateCcw}
            subLabel="All Completed"
            colorScheme="cyan"
            loading={loading}
          />
        </div>

        {/* Tabs for Filtering - scrollable on mobile */}
        <div className="flex items-center gap-3 md:gap-4 mb-8 overflow-x-auto pb-2 no-scrollbar">
          <Button
            variant={activeTab === "today" ? "default" : "outline"}
            onClick={() => {
              changeTab("today")
              setFilterDate("")
              setFilterMonth("all")
              setFilterYear("all")
            }}
            className={cn(
              "rounded-2xl px-4 md:px-6 font-bold transition-all whitespace-nowrap",
              activeTab === "today" ? "shadow-lg shadow-emerald-500/20" : "bg-white/50 dark:bg-slate-900/50"
            )}
          >
            Today's Offline
          </Button>
          <Button
            variant={activeTab === "all" ? "default" : "outline"}
            onClick={() => changeTab("all")}
            className={cn(
              "rounded-2xl px-4 md:px-6 font-bold transition-all whitespace-nowrap",
              activeTab === "all" ? "shadow-lg shadow-blue-500/20" : "bg-white/50 dark:bg-slate-900/50"
            )}
          >
            All Offline
          </Button>
          <Button
            variant={activeTab === "online" ? "default" : "outline"}
            onClick={() => {
              changeTab("online")
              setFilterDate("")
              setFilterMonth("all")
              setFilterYear("all")
            }}
            className={cn(
              "rounded-2xl px-4 md:px-6 font-bold transition-all whitespace-nowrap",
              activeTab === "online" ? "shadow-lg shadow-indigo-500/20" : "bg-white/50 dark:bg-slate-900/50"
            )}
          >
            Today's Online
          </Button>
          <Button
            variant={activeTab === "allOnline" ? "default" : "outline"}
            onClick={() => {
              changeTab("allOnline")
              setFilterDate("")
              setFilterMonth("all")
              setFilterYear("all")
            }}
            className={cn(
              "rounded-2xl px-4 md:px-6 font-bold transition-all whitespace-nowrap",
              activeTab === "allOnline" ? "shadow-lg shadow-violet-500/20" : "bg-white/50 dark:bg-slate-900/50"
            )}
          >
            All Online
          </Button>
        </div>


        {/* Appointments List */}
        <div className="glass-premium rounded-3xl p-4 md:p-8 hover:shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-6 duration-1000">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Upcoming Appointments</h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Chronological overview of scheduled visits</p>
            </div>
            <div className="flex flex-col items-end gap-3 w-full md:w-auto">
              <div className="flex flex-wrap items-center justify-end gap-2">
                <div className="relative">
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => {
                      setFilterDate(e.target.value)
                      if (e.target.value) setActiveTab("all")
                    }}
                    className="w-[160px] h-10 px-3 rounded-md border border-input bg-white/50 dark:bg-slate-900/50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                {user && (user.role === "ADMIN" || user.role === "STAFF") && (
                  <Select value={filterDoctor} onValueChange={(val) => {
                    setFilterDoctor(val)
                    if (val !== "all") setActiveTab("all")
                  }}>
                    <SelectTrigger className="w-[150px] bg-white/50 dark:bg-slate-900/50">
                      <SelectValue placeholder="All Doctors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Doctors</SelectItem>
                      {doctors.map(d => (
                        <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Select value={filterMonth} onValueChange={(val) => {
                  setFilterMonth(val)
                  if (val !== "all") setActiveTab("all")
                }}>
                  <SelectTrigger className="w-[130px] bg-white/50 dark:bg-slate-900/50">
                    <SelectValue placeholder="All Months" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Months</SelectItem>
                    <SelectItem value="01">January</SelectItem>
                    <SelectItem value="02">February</SelectItem>
                    <SelectItem value="03">March</SelectItem>
                    <SelectItem value="04">April</SelectItem>
                    <SelectItem value="05">May</SelectItem>
                    <SelectItem value="06">June</SelectItem>
                    <SelectItem value="07">July</SelectItem>
                    <SelectItem value="08">August</SelectItem>
                    <SelectItem value="09">September</SelectItem>
                    <SelectItem value="10">October</SelectItem>
                    <SelectItem value="11">November</SelectItem>
                    <SelectItem value="12">December</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterYear} onValueChange={(val) => {
                  setFilterYear(val)
                  if (val !== "all") setActiveTab("all")
                }}>
                  <SelectTrigger className="w-[110px] bg-white/50 dark:bg-slate-900/50">
                    <SelectValue placeholder="All Years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(filterDate || filterDoctor !== "all" || filterMonth !== "all" || filterYear !== "all") && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setFilterDate("")
                      setFilterDoctor("all")
                      setFilterMonth("all")
                      setFilterYear("all")
                      changeTab("today")
                    }}
                    className="h-10 w-10 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Reset Filters"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {user && (user.role === "ADMIN" || user.role === "STAFF") && (
                <CreateAppointmentDialog onSuccess={fetchAppointments}>
                  <Button className="rounded-xl px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105 transition-transform whitespace-nowrap h-10">
                    <Calendar className="h-4 w-4 mr-2" />
                    Create Appointment
                  </Button>
                </CreateAppointmentDialog>
              )}
            </div>
          </div>

          <div>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-8">
                {/* Emergency Appointments Section */}
                {emergencyAppts.length > 0 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-1 bg-red-500 rounded-full" />
                      <h4 className="text-lg font-black tracking-tight text-red-600 dark:text-red-400 uppercase">Emergency Appointments</h4>
                      <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200 font-black px-3 py-0.5 rounded-full text-[10px]">CRITICAL</Badge>
                    </div>

                    <div className="rounded-2xl border-2 border-red-100 dark:border-red-900/30 overflow-x-auto bg-red-50/30 dark:bg-red-950/10 shadow-xl shadow-red-500/5">
                      <Table>
                        <TableHeader className="bg-red-500/5 dark:bg-red-950/30">
                          <TableRow className="hover:bg-transparent border-red-100 dark:border-red-900/30">
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-red-600/70 h-12 w-10">S.no</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-red-600/70 h-12">Patient Name</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-red-600/70 h-12">Contact</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-red-600/70 h-12 text-center">Time</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-red-600/70 h-12">Doctor</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-red-600/70 h-12">Status</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-red-600/70 h-12 text-center">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {emergencyAppts.map((apt, index) => (
                            <TableRow key={apt.id || apt._id} className="group hover:bg-red-500/5 transition-colors border-red-100 dark:border-red-900/30 bg-white/40 dark:bg-slate-900/40">
                              <TableCell className="font-mono text-[11px] text-red-600/50 py-4 font-black">
                                {index + 1}
                              </TableCell>
                              <TableCell className="font-bold text-slate-900 dark:text-white py-4">
                                <Link href={`/patients/${apt.patient_id}`} className="hover:underline hover:text-red-600 transition-colors duration-200 flex items-center gap-2">
                                  {apt.patient_name}
                                  <AlertTriangle className="h-3 w-3 text-red-500 animate-pulse" />
                                </Link>
                              </TableCell>
                              <TableCell className="font-mono text-[11px] text-slate-500 py-4">
                                {formatPhoneWithPrefix(apt.phone)}
                              </TableCell>
                              <TableCell className="py-4 text-center">
                                {apt.status === 'Rejected' ? (
                                  <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">N/A</span>
                                ) : (
                                  <div className="flex items-center justify-center gap-2 text-sm font-black text-red-600 dark:text-red-400 bg-red-500/5 rounded-lg px-3 py-1.5 w-fit mx-auto">
                                    <Clock className="h-3.5 w-3.5" />
                                    {apt.time || "ASAP"}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="font-bold text-sm text-slate-700 dark:text-slate-200 py-4">{apt.doctor}</TableCell>
                              <TableCell className="py-4">
                                <Badge className={cn(
                                  "h-7 text-[10px] font-black uppercase tracking-wider rounded-lg border-none px-3",
                                  apt.status === "Awaiting Payment" ? "bg-amber-500/10 text-amber-700" : "bg-red-500/10 text-red-700"
                                )}>
                                  {apt.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-4">
                                {apt.status === 'Pending' ? (
                                  <div className="p-3 rounded-2xl bg-gradient-to-br from-red-500/10 to-rose-500/20 border border-red-500/20 space-y-3 animate-in zoom-in-95 duration-500 shadow-lg shadow-red-500/5">
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        className="h-8 flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95 px-3"
                                        onClick={() => handleEmergencyAction(apt, 'approve')}
                                        disabled={!!isProcessingEmergency && isProcessingEmergency.startsWith(apt.id || apt._id)}
                                      >
                                        {isProcessingEmergency === `${apt.id || apt._id}-approve` ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          "Approve"
                                        )}
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 flex-1 border-rose-200 dark:border-rose-900/50 bg-white/50 dark:bg-transparent text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all hover:scale-[1.02] active:scale-95 px-3"
                                        onClick={() => handleEmergencyAction(apt, 'reject')}
                                        disabled={!!isProcessingEmergency && isProcessingEmergency.startsWith(apt.id || apt._id)}
                                      >
                                        {isProcessingEmergency === `${apt.id || apt._id}-reject` ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          "Reject"
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                ) : apt.status === 'Rejected' ? (
                                  <div className="flex items-center justify-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 bg-red-500/5 px-3 py-1.5 rounded-lg border border-red-200/50">
                                      Not approved
                                    </span>
                                  </div>
                                ) : apt.status === 'Awaiting Payment' ? (
                                  <div className="flex items-center justify-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-500/5 px-3 py-1.5 rounded-lg border border-amber-200/50">
                                      Awaiting Approval
                                    </span>
                                  </div>
                                ) : (apt.status === 'Scheduled' || apt.status === 'Confirmed' || apt.status === 'Completed') ? (
                                  <div className="flex items-center justify-center gap-1.5">
                                    {user && user.role !== "STAFF" && (
                                      <CreatePrescriptionDialog preselectedPatientId={apt.patient_id} appointmentId={apt.id || apt._id}>
                                        <Button variant="outline" size="sm" className="h-7 px-2.5 rounded-lg border-blue-200 dark:border-blue-800 text-blue-600 hover:bg-blue-600 hover:text-white transition-all font-bold text-[10px] uppercase tracking-widest" title="Prescribe">
                                          Rx
                                        </Button>
                                      </CreatePrescriptionDialog>
                                    )}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 px-2.5 rounded-lg border-indigo-200 dark:border-indigo-800 text-indigo-600 font-bold text-[10px] uppercase tracking-widest transition-all hover:bg-indigo-600 hover:text-white"
                                      onClick={() => window.open(`https://meet.jit.si/appointment-portal-${apt._id || apt.id}`, '_blank')}
                                      title="Join Video Call"
                                    >
                                      <Video className="h-3 w-3 mr-1" />
                                      Join
                                    </Button>
                                    <EditAppointmentDialog appointment={apt} onSuccess={fetchAppointments}>
                                      <Button variant="ghost" size="sm" className="h-8 px-3 rounded-xl hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all font-bold text-[10px] uppercase tracking-widest border border-slate-200 dark:border-slate-800" title="Edit Appointment">
                                        Manage
                                      </Button>
                                    </EditAppointmentDialog>
                                  </div>
                                ) : null}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* Regular Appointments Section */}
                <div className="space-y-4">
                  {emergencyAppts.length > 0 && <div className="h-px bg-slate-200 dark:bg-slate-800" />}
                  <div className="rounded-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-x-auto bg-white/30 dark:bg-slate-950/30">
                    <Table>
                      <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                        <TableRow className="hover:bg-transparent border-slate-200/50 dark:border-slate-800/50">
                          <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 h-12 w-10">S.no</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 h-12">Patient Name</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 h-12">APPOINTMENT ID</TableHead>
                          {activeTab !== "today" && activeTab !== "online" && (
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 h-12">Date</TableHead>
                          )}
                          <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 h-12 text-center">Time</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 h-12">Doctor</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 h-12">Specialty</TableHead>
                          {activeTab !== "online" && activeTab !== "allOnline" && (
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 h-12">Visit Type</TableHead>
                          )}
                          <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 h-12">Status</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 h-12 text-center">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedAppointments.length > 0 ? (
                          paginatedAppointments.map((apt, index) => (
                            <TableRow key={apt.id || apt._id} className="group hover:bg-slate-500/5 transition-colors border-slate-200/50 dark:border-slate-800/50">
                              <TableCell className="font-mono text-[11px] text-slate-500 py-4">
                                {(currentPage - 1) * itemsPerPage + index + 1}
                              </TableCell>
                              <TableCell className="font-bold text-slate-900 dark:text-white py-4">
                                <Link href={`/patients/${apt.patient_id}`} className="hover:underline hover:text-blue-600 transition-colors duration-200">
                                  {apt.patient_name}
                                </Link>

                                {apt.reschedule_status === 'pending' && (
                                  <div className="mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2.5 animate-in fade-in slide-in-from-left-2 duration-500">
                                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-widest">
                                      <RotateCcw className="h-3 w-3" /> Reschedule Requested
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                        <Calendar className="h-3.5 w-3.5 text-blue-500" /> {apt.reschedule_requested_date}
                                      </div>
                                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                        <Clock className="h-3.5 w-3.5 text-amber-500" /> {apt.reschedule_requested_time}
                                      </div>
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                      <Button
                                        size="sm"
                                        className="h-8 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                                        onClick={() => handleRescheduleAction(apt, 'approve')}
                                      >
                                        Approve
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 px-4 border-rose-200 dark:border-rose-900/50 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95"
                                        onClick={() => handleRescheduleAction(apt, 'reject')}
                                      >
                                        Reject
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                {apt.reschedule_status === 'approved' && (
                                  <Badge variant="outline" className="mt-2 bg-emerald-500/10 text-emerald-600 border-emerald-200 text-[9px] font-black tracking-widest uppercase">
                                    Time Updated
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="font-mono text-[11px] text-slate-500 py-4">
                                {apt.id}
                              </TableCell>
                              {activeTab !== "today" && activeTab !== "online" && (
                                <TableCell className="py-4">
                                  <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                                    <Calendar className="h-3.5 w-3.5 text-blue-500" />
                                    {apt.date}
                                  </div>
                                </TableCell>
                              )}
                              <TableCell className="py-4 text-center">
                                {apt.status === 'Rejected' || apt.status === 'Cancelled' || !apt.time ? (
                                  <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">N/A</span>
                                ) : (
                                  <div className="flex items-center justify-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 w-fit mx-auto">
                                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                                    {apt.time}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="font-bold text-sm text-slate-700 dark:text-slate-200 py-4">{apt.doctor}</TableCell>
                              <TableCell className="py-4">
                                {apt.specialty ? (
                                  <Badge variant="secondary" className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200/50 dark:border-purple-800/50 text-[10px] font-bold rounded-lg px-2">
                                    {(() => {
                                      const doctor = doctors.find(d => d.name === apt.doctor)
                                      const specialty = specialties.find(s => s.id === doctor?.specialty_id)
                                      return specialty?.name || apt.specialty || "General"
                                    })()}
                                  </Badge>
                                ) : (
                                  <span className="text-slate-400 text-[10px] font-black uppercase tracking-tighter">N/A</span>
                                )}
                              </TableCell>
                              {activeTab !== "online" && activeTab !== "allOnline" && (
                                <TableCell className="py-4">
                                  <Badge variant="outline" className="text-[10px] font-bold border-slate-200 dark:border-slate-800 rounded-lg px-2">{apt.type}</Badge>
                                </TableCell>
                              )}
                              <TableCell className="py-4">
                                <Select
                                  value={apt.status}
                                  onValueChange={(val) => handleStatusChange(apt.id || apt._id, val)}
                                >
                                  <SelectTrigger className={`h-8 w-[120px] text-[10px] font-black uppercase tracking-wider rounded-lg border-none ${apt.status === "Completed" ? "bg-emerald-500/10 text-emerald-700" :
                                    apt.status === "Cancelled" ? "bg-rose-500/10 text-rose-700" :
                                      apt.status === "Awaiting Payment" ? "bg-amber-500/10 text-amber-700" :
                                        "bg-blue-500/10 text-blue-700"
                                    }`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                                    <SelectItem value="Awaiting Payment">Awaiting Payment</SelectItem>
                                    <SelectItem value="Confirmed">Confirmed</SelectItem>
                                    <SelectItem value="Pending">Pending</SelectItem>
                                    <SelectItem value="Completed">Completed</SelectItem>
                                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="text-right py-4">
                                <div className="flex items-center justify-end gap-1.5">
                                  {user && user.role !== "STAFF" && (
                                    <CreatePrescriptionDialog preselectedPatientId={apt.patient_id} appointmentId={apt.id || apt._id}>
                                      <Button variant="outline" size="sm" className="h-7 px-2.5 rounded-lg border-blue-200 dark:border-blue-800 text-blue-600 hover:bg-blue-600 hover:text-white transition-all font-bold text-[10px] uppercase tracking-widest" title="Prescribe">
                                        Rx
                                      </Button>
                                    </CreatePrescriptionDialog>
                                  )}
                                  {(apt.type === "Online Consultation" || apt.type === "Emergency" || apt.type === "Online OPD" || apt.notes?.includes("[Online Booking]") || (apt.notes?.includes("[Booked From MOBILE APP]") && apt.type !== "OPD") || apt.notes?.includes("Online")) && (
                                    (() => {
                                      const enabled = apt.type === "Online Consultation" || apt.type === "Emergency" || apt.type === "Online OPD" || isVideoEnabled(apt.date, apt.time) || apt.notes?.includes("Online");
                                      return (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className={cn(
                                            "h-7 px-2.5 rounded-lg border-indigo-200 dark:border-indigo-800 text-indigo-600 font-bold text-[10px] uppercase tracking-widest transition-all",
                                            enabled ? "hover:bg-indigo-600 hover:text-white" : "opacity-50 cursor-not-allowed bg-slate-100"
                                          )}
                                          onClick={() => enabled && window.open(`https://meet.jit.si/appointment-portal-${apt._id || apt.id}`, '_blank')}
                                          title={enabled ? "Join Video Call" : "Video will enable before 5 min"}
                                          disabled={!enabled}
                                        >
                                          <Video className="h-3 w-3 mr-1" />
                                          Join
                                        </Button>
                                      )
                                    })()
                                  )}
                                  <EditAppointmentDialog appointment={apt} onSuccess={fetchAppointments}>
                                    <Button variant="ghost" size="sm" className="h-7 px-2 rounded-lg hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all font-bold text-[10px] uppercase tracking-widest" title="Edit Appointment">
                                      Edit
                                    </Button>
                                  </EditAppointmentDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={10} className="text-center text-slate-500 py-12 font-medium">
                              No upcoming appointments found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Showing <span className="font-bold">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-bold">{Math.min(currentPage * itemsPerPage, regularAppts.length)}</span> of <span className="font-bold">{regularAppts.length}</span> appointments
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg border-slate-200 dark:border-slate-800"
                  >
                    Previous
                  </Button>
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-300 w-20 text-center">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border-slate-200 dark:border-slate-800"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
