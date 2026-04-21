"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Download, Eye, X, Plus, Loader2, Search, Activity, Clock, Users, ExternalLink } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreateMedicalRecordDialog } from "@/components/create-medical-record-dialog"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { useRouter } from "next/navigation"

interface MedicalRecord {
  id: string
  patient_name: string
  patient_id: string
  record_type: string
  date: string
  doctor: string
  status: "Active" | "Archived"
  summary: string
  attachment_url?: string
  attachment_type?: string
}

export default function MedicalRecordsPage() {
  const router = useRouter()
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  const fetchRecords = useCallback(async () => {
    try {
      const res = await fetch("/api/medical-records")
      if (res.ok) {
        const data = await res.json()
        setRecords(data)
      }
    } catch (error) {
      console.error("Failed to fetch medical records:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, typeFilter, statusFilter])

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      record.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === "all" || record.record_type === typeFilter
    const matchesStatus = statusFilter === "all" || record.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const totalCount = records.length
  const activeCount = records.filter((r) => r.status === "Active").length
  const archivedCount = records.filter((r) => r.status === "Archived").length

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / itemsPerPage))
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const [editLoading, setEditLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedSummary, setEditedSummary] = useState("")

  const handleUpdateRecord = async () => {
    if (!selectedRecord) return
    setEditLoading(true)
    try {
      const res = await fetch(`/api/medical-records/${selectedRecord.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: editedSummary }),
      })
      if (res.ok) {
        const updated = await res.json()
        setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
        setSelectedRecord(updated)
        setIsEditing(false)
      }
    } catch (error) {
      console.error("Failed to update record:", error)
    } finally {
      setEditLoading(false)
    }
  }

  const openRecord = (record: MedicalRecord) => {
    setSelectedRecord(record)
    setEditedSummary(record.summary)
    setIsEditing(false)
  }

  return (
    <main className="relative flex-1 min-h-screen overflow-x-hidden overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-blue-900/20">
      {/* Decorative Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="blob top-[-10%] left-[-10%]" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <div className="container mx-auto relative py-6 md:py-10 px-4 md:px-8">
        <PageHeader title="Medical Records" description="Access and manage patient medical records" showSearch />



        {/* Records Stats */}
        <div className="grid gap-4 md:gap-8 grid-cols-1 md:grid-cols-3 mb-8 md:mb-10">
          <StatCard
            label="Total Records"
            value={totalCount}
            icon={FileText}
            subLabel="Complete history"
            colorScheme="blue"
            loading={loading}
          />
          <StatCard
            label="Active Records"
            value={activeCount}
            icon={Activity}
            subLabel="Live admissions"
            colorScheme="emerald"
            loading={loading}
          />
          <StatCard
            label="Archived"
            value={archivedCount}
            icon={Clock}
            subLabel="Legacy data stored"
            colorScheme="indigo"
            loading={loading}
          />
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by patient name or record ID..."
              className="pl-10 h-11 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-slate-800 rounded-xl focus:ring-blue-500/20 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-[200px] h-11 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-slate-800 rounded-xl focus:ring-blue-500/20">
              <SelectValue placeholder="All Record Types" />
            </SelectTrigger>
            <SelectContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-slate-200 dark:border-slate-800 rounded-xl">
              <SelectItem value="all">All Record Types</SelectItem>
              <SelectItem value="Medical History">Medical History</SelectItem>
              <SelectItem value="Surgical Report">Surgical Report</SelectItem>
              <SelectItem value="Discharge Summary">Discharge Summary</SelectItem>
              <SelectItem value="Progress Notes">Progress Notes</SelectItem>
              <SelectItem value="Treatment Plan">Treatment Plan</SelectItem>
              <SelectItem value="Lab Report">Lab Report</SelectItem>
              <SelectItem value="Imaging Report">Imaging Report</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[150px] h-11 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-slate-800 rounded-xl focus:ring-blue-500/20">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-slate-200 dark:border-slate-800 rounded-xl">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Medical Records Table */}
        <div className="glass-premium rounded-3xl p-4 md:p-8 hover:shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-6 duration-1000">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Recent Medical Records</h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Chronological overview of patient documentation</p>
            </div>
            <CreateMedicalRecordDialog onCreated={fetchRecords}>
              <Button className="w-full sm:w-auto h-11 rounded-xl px-6 bg-[#e05d38] text-white hover:bg-[#c94f2f] hover:scale-105 transition-transform">
                <Plus className="h-4 w-4 mr-2" />
                Create Record
              </Button>
            </CreateMedicalRecordDialog>
          </div>


          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
              <span className="text-slate-500 dark:text-slate-400 font-medium">Loading medical records...</span>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
              <div className="p-4 bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl mb-4">
                <FileText className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-lg">No Records Found</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">Create the first medical record to start managing patient data.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto bg-white/30 dark:bg-slate-950/30">
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                  <TableRow className="hover:bg-transparent border-slate-200 dark:border-slate-800">
                    <TableHead className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Sr No</TableHead>
                    <TableHead className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Record ID</TableHead>
                    <TableHead className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Patient Name</TableHead>
                    <TableHead className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Record Type</TableHead>
                    <TableHead className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Date</TableHead>
                    <TableHead className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Doctor</TableHead>
                    <TableHead className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Status</TableHead>
                    <TableHead className="text-right font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRecords.map((record, index) => (
                    <TableRow key={record.id} className="hover:bg-blue-500/5 dark:hover:bg-blue-400/5 border-slate-100 dark:border-slate-800 transition-colors">
                      <TableCell className="text-xs font-bold text-slate-400">
                        {((currentPage - 1) * itemsPerPage) + index + 1}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{record.id}</TableCell>
                      <TableCell className="font-black text-slate-900 dark:text-white">{record.patient_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <FileText className="h-3.5 w-3.5 text-slate-500" />
                          </div>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{record.record_type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-slate-600 dark:text-slate-400">{record.date}</TableCell>
                      <TableCell className="text-sm font-bold text-slate-900 dark:text-white">{record.doctor}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            record.status === "Active"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                          }
                        >
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${record.status === "Active" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          {record.attachment_url && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-[#e05d38]/70 hover:bg-[#e05d38]/10 hover:text-[#e05d38] rounded-xl"
                              onClick={(e) => { e.stopPropagation(); window.open(record.attachment_url, '_blank'); }}
                              title="View Attachment"
                            >
                              <ExternalLink className="h-4.5 w-4.5" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => openRecord(record)} className="hover:bg-blue-500/10 hover:text-blue-600 dark:hover:bg-blue-400/10 rounded-xl" title="View Details">
                            <Eye className="h-4.5 w-4.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:bg-emerald-400/10 rounded-xl" title="Download">
                            <Download className="h-4.5 w-4.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {!loading && totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Showing <span className="font-bold">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-bold">{Math.min(currentPage * itemsPerPage, filteredRecords.length)}</span> of <span className="font-bold">{filteredRecords.length}</span> records
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

      {/* Record Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4">
          <Card className="w-full h-[90vh] max-w-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-white/20 dark:border-slate-800 shadow-2xl rounded-3xl overflow-y-scroll animate-in zoom-in-95 duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <CardTitle className="text-2xl font-black text-slate-900 dark:text-white">Clinical Detail</CardTitle>
                <p className="text-sm font-medium text-slate-500">Record #{selectedRecord.id}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedRecord(null)} className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-8 pt-8 px-8">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Patient Name</p>
                  <p className="font-black text-slate-900 dark:text-white">{selectedRecord.patient_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Record Type</p>
                  <Badge variant="outline" className="font-bold border-slate-200 dark:border-slate-700">{selectedRecord.record_type}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Consulting Doctor</p>
                  <p className="font-bold text-slate-900 dark:text-white">{selectedRecord.doctor}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</p>
                  <p className="font-bold text-slate-900 dark:text-white">{selectedRecord.date}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
                  <Badge
                    className={
                      selectedRecord.status === "Active"
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                    }
                  >
                    {selectedRecord.status}
                  </Badge>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Clinical Summary</p>
                  {!isEditing && (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs px-4">
                      Edit Summary
                    </Button>
                  )}
                </div>
                {isEditing ? (
                  <div className="space-y-4">
                    <Textarea
                      className="min-h-[200px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-blue-500/20 transition-all font-medium text-slate-700 dark:text-slate-300"
                      value={editedSummary}
                      onChange={(e) => setEditedSummary(e.target.value)}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="rounded-xl font-bold">
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleUpdateRecord} disabled={editLoading} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 font-bold">
                        {editLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50/80 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner">
                    <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 font-medium italic">
                      "{selectedRecord.summary}"
                    </p>
                  </div>
                )}
              </div>

              {selectedRecord.attachment_url && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Medical Attachment</p>
                    <a
                      href={selectedRecord.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-black text-[#e05d38] hover:underline uppercase tracking-widest"
                    >
                      Open Full View
                    </a>
                  </div>
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-2 min-h-[150px]">
                    {selectedRecord.attachment_type?.startsWith("image/") ? (
                      <img
                        src={selectedRecord.attachment_url}
                        alt="Medical Attachment"
                        className="max-w-full h-auto rounded-xl shadow-lg"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 py-8">
                        <FileText className="w-10 h-10 text-rose-500" />
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-400">PDF Document Attached</p>
                        <a
                          href={selectedRecord.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 px-4 py-1.5 bg-rose-500 text-white rounded-lg font-bold text-xs hover:bg-rose-600 transition-colors"
                        >
                          View Document
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  )
}
