"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, ChevronLeft, ChevronRight, Loader2, Calendar, RotateCcw, ClipboardList } from "lucide-react"
import { cn } from "@/lib/utils"

export default function OPDListPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState<"today" | "all">("today")
  const [filterMonth, setFilterMonth] = useState("all")
  const [filterYear, setFilterYear] = useState("all")
  const itemsPerPage = 10

  const [opds, setOpds] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [specialties, setSpecialties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  /** Today's date formatted exactly as the OPD form stores it: "26 Mar 2026" */
  const todayFormatted = (() => {
    const now = new Date()
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return `${String(now.getDate()).padStart(2, '0')} ${months[now.getMonth()]} ${now.getFullYear()}`
  })()

  const fetchOpds = async (tab: "today" | "all") => {
    setLoading(true)
    try {
      const opdUrl = tab === "today"
        ? `/api/opd?date=${encodeURIComponent(todayFormatted)}`
        : "/api/opd"

      const [opdRes, docRes, specRes, meRes] = await Promise.all([
        fetch(opdUrl),
        fetch("/api/doctors"),
        fetch("/api/specialties"),
        fetch("/api/auth/me"),
      ])
      const [opdData, docData, specData, meData] = await Promise.all([
        opdRes.json(),
        docRes.json(),
        specRes.json(),
        meRes.json(),
      ])
      setOpds(Array.isArray(opdData) ? opdData : [])
      setDoctors(Array.isArray(docData) ? docData : [])
      setSpecialties(Array.isArray(specData) ? specData : [])
      if (meRes.ok) setUser(meData.user)
    } catch (error) {
      console.error("Failed to fetch OPDs:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOpds(activeTab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, activeTab, filterMonth, filterYear])

  /**
   * Parse the OPD date field which is stored as e.g. "26 Mar 2026".
   * Returns a Date set to local midnight of that day, or null if unparseable.
   */
  const parseOpdDate = (dateStr: string): Date | null => {
    if (!dateStr) return null
    // Standardize to spaces before parsing
    const normalized = dateStr.replace(/\//g, ' ')
    const d = new Date(normalized)
    return isNaN(d.getTime()) ? null : d
  }

  /** Today's local midnight */
  const todayMidnight = (() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  })()

  /** Resolve the specialty name for a given OPD consultant string */
  const getSpecialtyName = (consultantName: string): string | null => {
    if (!consultantName) return null
    const doc = doctors.find(
      (d) => d.name?.trim().toLowerCase() === consultantName.trim().toLowerCase()
    )
    if (!doc?.specialty_id) return null
    const spec = specialties.find((s) => s.id === doc.specialty_id)
    return spec?.name ?? null
  }

  /** Filter OPDs */
  const filteredOpds = opds.filter((opd) => {
    // Text search
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      (opd.patient_name && opd.patient_name.toLowerCase().includes(term)) ||
      (opd.mobile_no && opd.mobile_no.includes(term)) ||
      (opd.opd_no && opd.opd_no.toLowerCase().includes(term)) ||
      (opd.uhid_no && opd.uhid_no.toLowerCase().includes(term))
    if (!matchesSearch) return false

    const opdDate = parseOpdDate(opd.date)

    // Today filter
    if (activeTab === "today") {
      if (!opdDate) return false
      const opdMidnight = new Date(opdDate.getFullYear(), opdDate.getMonth(), opdDate.getDate())
      if (opdMidnight.getTime() !== todayMidnight.getTime()) return false
    }

    // Month filter (1-indexed, matches Select value "01"–"12")
    if (filterMonth !== "all") {
      if (!opdDate) return false
      const month = String(opdDate.getMonth() + 1).padStart(2, "0")
      if (month !== filterMonth) return false
    }

    // Year filter
    if (filterYear !== "all") {
      if (!opdDate) return false
      if (String(opdDate.getFullYear()) !== filterYear) return false
    }

    return true
  })

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredOpds.length / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedOpds = filteredOpds.slice(startIndex, startIndex + itemsPerPage)

  const hasFilters = filterMonth !== "all" || filterYear !== "all"

  return (
    <main className="flex-1">
      <div className="container mx-auto py-6 md:py-8 px-4 md:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">OPD List</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage and view OPD registrations</p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-6">
          <Button
            variant={activeTab === "today" ? "default" : "outline"}
            onClick={() => {
              setActiveTab("today")
              setFilterMonth("all")
              setFilterYear("all")
            }}
            className={cn(
              "flex-1 sm:flex-none rounded-2xl px-6 font-bold transition-all text-xs sm:text-sm h-10 sm:h-11",
              activeTab === "today" ? "shadow-lg shadow-emerald-500/20" : "bg-white/50 dark:bg-slate-900/50"
            )}
          >
            Today&apos;s OPD
          </Button>
          <Button
            variant={activeTab === "all" ? "default" : "outline"}
            onClick={() => setActiveTab("all")}
            className={cn(
              "flex-1 sm:flex-none rounded-2xl px-6 font-bold transition-all text-xs sm:text-sm h-10 sm:h-11",
              activeTab === "all" ? "shadow-lg shadow-blue-500/20" : "bg-white/50 dark:bg-slate-900/50"
            )}
          >
            All OPD&apos;s
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>OPD Records</CardTitle>
            <div className="flex flex-col gap-3 mt-4 lg:flex-row lg:items-center">
              {/* Search */}
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search name, mobile, OPD, UHID..."
                  className="pl-10 h-10 sm:h-11 bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex flex-row items-center gap-2 sm:gap-3 flex-1 lg:flex-none">
                {/* Month Filter */}
                <Select
                  value={filterMonth}
                  onValueChange={(val) => {
                    setFilterMonth(val)
                    if (val !== "all") setActiveTab("all")
                  }}
                >
                  <SelectTrigger className="flex-1 lg:w-[140px] h-10 sm:h-11 bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl font-medium text-xs sm:text-sm">
                    <SelectValue placeholder="All Months" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
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

                {/* Year Filter */}
                <Select
                  value={filterYear}
                  onValueChange={(val) => {
                    setFilterYear(val)
                    if (val !== "all") setActiveTab("all")
                  }}
                >
                  <SelectTrigger className="flex-1 lg:w-[120px] h-10 sm:h-11 bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl font-medium text-xs sm:text-sm">
                    <SelectValue placeholder="All Years" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">All Years</SelectItem>
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Reset Filters */}
                {hasFilters && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setFilterMonth("all")
                      setFilterYear("all")
                      setActiveTab("today")
                    }}
                    className="h-10 w-10 sm:h-11 sm:w-11 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all rounded-xl"
                    title="Reset Filters"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Results count */}
                <div className="mb-4 text-sm text-muted-foreground">
                  Showing {filteredOpds.length > 0 ? startIndex + 1 : 0} to{" "}
                  {Math.min(startIndex + itemsPerPage, filteredOpds.length)} of {filteredOpds.length} results
                </div>

                {/* Table */}
                <div className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-x-auto bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">S.no</TableHead>
                        <TableHead>OPD No</TableHead>
                        <TableHead>UHID</TableHead>
                        <TableHead>Token No</TableHead>
                        <TableHead>Patient Name</TableHead>
                        <TableHead>Age/Sex</TableHead>
                        <TableHead>Phone / UCCN</TableHead>
                        <TableHead>Consultant</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Valid Upto</TableHead>
                        {user?.role === "DOCTOR" && (
                          <TableHead className="text-center">Actions</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedOpds.length > 0 ? (
                        paginatedOpds.map((opd, index) => {
                          const specialtyName = getSpecialtyName(opd.consultant)
                          return (
                            <TableRow key={opd.id || opd.opd_no}>
                              <TableCell className="font-mono text-[11px] text-muted-foreground">{startIndex + index + 1}</TableCell>
                              <TableCell className="font-mono text-sm font-medium">{opd.opd_no}</TableCell>
                              <TableCell className="font-mono text-sm">{opd.uhid_no}</TableCell>
                              <TableCell>{opd.token_no}</TableCell>
                              <TableCell className="font-medium">{opd.patient_name}</TableCell>
                              <TableCell className="text-muted-foreground">{opd.age_sex}</TableCell>
                              <TableCell className="text-muted-foreground font-medium">
                                {opd.unique_citizen_card_number ? (
                                  <span className="text-blue-600 dark:text-blue-400">{opd.unique_citizen_card_number}</span>
                                ) : (
                                  opd.mobile_no
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium text-sm">{opd.consultant}</span>
                                  {specialtyName && (
                                    <span className="text-[11px] text-muted-foreground mt-0.5">{specialtyName}</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center text-muted-foreground">
                                  <Calendar className="mr-2 h-4 w-4 shrink-0" />
                                  {opd.date}
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {(opd.unique_citizen_card_number || opd.patient_type === "Online Client") ? "Null" : opd.valid_upto}
                              </TableCell>
                              {user?.role === "DOCTOR" && (
                                <TableCell className="text-center">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-3 rounded-lg border-emerald-200 dark:border-emerald-800 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all font-bold text-xs uppercase tracking-widest whitespace-nowrap"
                                    onClick={() =>
                                      router.push(`/appointments?patient=${encodeURIComponent(opd.patient_name ?? "")}`)
                                    }
                                  >
                                    <ClipboardList className="h-3.5 w-3.5 mr-1" />
                                    Check Appt
                                  </Button>
                                </TableCell>
                              )}
                            </TableRow>
                          )
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={user?.role === "DOCTOR" ? 11 : 10} className="text-center text-muted-foreground py-8">
                            No OPD registrations found matching your criteria
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
