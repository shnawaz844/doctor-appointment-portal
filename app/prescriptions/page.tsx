"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pill, Package, X, Eye, Loader2, ClipboardList, Search, FileImage, ExternalLink } from "lucide-react"
import { CreatePrescriptionDialog } from "@/components/create-prescription-dialog"
import { Input } from "@/components/ui/input"
import { StatCard } from "@/components/ui/stat-card"

interface Prescription {
  _id: string
  id: string
  patient_name: string
  patient_id: string
  medications: {
    medication: string
    dosage: string
    quantity: number
  }[]
  issued: string
  status: "Active" | "Filled" | "Expired"
  doctor_name: string
  doctor_id: string
  instructions?: string
  duration?: string
  attachment_url?: string
  attachment_type?: string
}

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<"all" | "Active" | "Filled">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<Prescription | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const fetchPrescriptions = useCallback(async () => {
    try {
      const res = await fetch("/api/prescriptions")
      if (res.ok) {
        const data = await res.json()
        setPrescriptions(data)
      }
    } catch (error) {
      console.error("Failed to fetch prescriptions:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPrescriptions()
  }, [fetchPrescriptions])

  useEffect(() => {
    setCurrentPage(1)
  }, [filterStatus, searchTerm])

  const filteredPrescriptions = prescriptions.filter((rx) => {
    const matchesStatus = filterStatus === "all" || rx.status === filterStatus
    const matchesSearch =
      rx.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rx.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rx.id.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesStatus && matchesSearch
  })

  const activeCount = prescriptions.filter((r) => r.status === "Active").length
  const filledCount = prescriptions.filter((r) => r.status === "Filled").length

  const totalPages = Math.max(1, Math.ceil(filteredPrescriptions.length / itemsPerPage))
  const paginatedPrescriptions = filteredPrescriptions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <main className="relative flex-1 min-h-screen overflow-x-hidden overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-blue-900/20">
      {/* Decorative Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="blob top-[-10%] left-[-10%]" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <div className="container mx-auto relative py-6 md:py-10 px-4 md:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Prescriptions</h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Manage prescriptions and medications</p>
        </div>



        {/* Pharmacy Stats */}
        <div className="grid gap-4 md:gap-8 grid-cols-1 md:grid-cols-3 mb-8 md:mb-10">
          <StatCard
            label="Active Prescriptions"
            value={loading ? "..." : activeCount.toLocaleString()}
            icon={Pill}
            subLabel="Currently active"
            colorScheme="blue"
            loading={loading}
            onClick={() => setFilterStatus("Active")}
          />
          <StatCard
            label="Filled"
            value={loading ? "..." : filledCount.toLocaleString()}
            icon={Package}
            subLabel="This month"
            colorScheme="emerald"
            loading={loading}
            onClick={() => setFilterStatus("Filled")}
          />
          <StatCard
            label="Total"
            value={loading ? "..." : prescriptions.length.toLocaleString()}
            icon={ClipboardList}
            subLabel="All prescriptions"
            colorScheme="indigo"
            loading={loading}
            onClick={() => setFilterStatus("all")}
          />
        </div>

        {/* Prescriptions Table */}
        <div className="glass-premium rounded-3xl p-4 md:p-8 hover:shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-6 duration-1000">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Recent Prescriptions</h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Detailed overview of medication issuances</p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative group w-full sm:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <Input
                  className="pl-11 h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-blue-500/20 w-full"
                  placeholder="Search name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <CreatePrescriptionDialog onCreated={fetchPrescriptions}>
                <Button className="w-full sm:w-auto h-11 rounded-xl px-6 bg-[#155dfc] text-white hover:bg-[#2918e1] hover:scale-105 transition-transform">
                  <Pill className="h-4 w-4 mr-2" />
                  Create Prescription
                </Button>
              </CreatePrescriptionDialog>
            </div>

          </div>

          <div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-3 font-bold text-slate-500">Loading prescriptions...</span>
              </div>
            ) : filteredPrescriptions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Pill className="h-12 w-12 text-slate-300 mb-3" />
                <h3 className="font-black text-slate-900 dark:text-white mb-1">No Prescriptions Found</h3>
                <p className="text-sm font-medium text-slate-500">Create the first prescription to get started.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-x-auto bg-white/30 dark:bg-slate-950/30">
                <Table>
                  <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                    <TableRow className="hover:bg-transparent border-slate-200/50 dark:border-slate-800/50">
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 h-12 w-16">S.No</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 h-12">Patient Name</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 h-12">Prescription ID</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 h-12">Medications</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 h-12">Doctor</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 h-12">Issued Date</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 h-12">Status</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 h-12 text-right">View</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPrescriptions.map((rx, index) => (
                      <TableRow key={rx.id || rx._id || index} className="group hover:bg-slate-500/5 transition-colors border-slate-200/50 dark:border-slate-800/50">
                        <TableCell className="font-mono text-[11px] font-bold text-slate-400 py-4">
                          {((currentPage - 1) * itemsPerPage) + index + 1}
                        </TableCell>
                        <TableCell className="font-bold text-slate-900 dark:text-white py-4">{rx.patient_name}</TableCell>
                        <TableCell className="font-mono text-[11px] text-slate-500 py-4">{rx.id}</TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                              <Pill className="h-3.5 w-3.5 text-blue-500" />
                              {rx.medications?.[0]?.medication || (rx as any).medication || "No medicine"}
                            </div>
                            {rx.medications?.length > 1 && (
                              <span className="text-[10px] font-black text-blue-500 opacity-70 uppercase tracking-tighter">
                                + {rx.medications.length - 1} more items
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-bold text-slate-700 dark:text-slate-300 py-4">{rx.doctor_name}</TableCell>
                        <TableCell className="text-sm font-medium text-slate-500 py-4">{rx.issued}</TableCell>
                        <TableCell className="py-4">
                          <Badge
                            className={`text-[10px] font-black uppercase tracking-wider rounded-lg px-2.5 py-1 ${rx.status === "Filled" ? "bg-emerald-500/10 text-emerald-700 border-emerald-200/50" : "bg-blue-500/10 text-blue-700 border-blue-200/50"
                              }`}
                          >
                            {rx.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right py-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 rounded-lg hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all p-0"
                            onClick={() => setSelectedPatient(rx)}
                            title="View prescription details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
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
                  Showing <span className="font-bold">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-bold">{Math.min(currentPage * itemsPerPage, filteredPrescriptions.length)}</span> of <span className="font-bold">{filteredPrescriptions.length}</span> prescriptions
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

      {/* Prescription Detail Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-hidden border-none bg-white dark:bg-slate-950 rounded-3xl shadow-2xl flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-black text-slate-900 dark:text-white">Prescription Details</CardTitle>
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  {selectedPatient.patient_name} • {selectedPatient.doctor_name.toLowerCase().startsWith('dr') ? selectedPatient.doctor_name : `Dr. ${selectedPatient.doctor_name}`}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedPatient(null)} className="h-10 w-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </Button>
            </CardHeader>

            <CardContent className="px-8 py-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/30 dark:bg-slate-950/30">
              <div className="space-y-8">
                {/* Admin Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Prescription No.</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white font-mono">{selectedPatient.id}</p>
                  </div>
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Patient ID</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white font-mono">{selectedPatient.patient_id}</p>
                  </div>
                </div>

                {/* Medications List */}
                <div className="space-y-4">
                  <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Prescribed Medications</h3>

                  {selectedPatient.medications?.map((med, idx) => (
                    <div key={idx} className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <Pill className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">Item {idx + 1}</p>
                            <h4 className="text-base font-black text-slate-900 dark:text-white">{med.medication}</h4>
                          </div>
                        </div>
                        {idx === 0 && (
                          <Badge className={`rounded-xl px-3 py-1 border-none font-bold text-[10px] ${selectedPatient.status === "Filled" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"}`}>
                            {selectedPatient.status}
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                          <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Dosage</p>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{med.dosage}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                          <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Quantity</p>
                          <p className="text-sm font-black text-slate-900 dark:text-white">{med.quantity} Units</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Legacy Fallback */}
                  {(!selectedPatient.medications || selectedPatient.medications.length === 0) && (selectedPatient as any).medication && (
                    <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500">
                          <Pill className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase">Legacy Record</p>
                          <h4 className="text-base font-black text-slate-900 dark:text-white">{(selectedPatient as any).medication}</h4>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                          <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Dosage</p>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{(selectedPatient as any).dosage || "N/A"}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                          <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Quantity</p>
                          <p className="text-sm font-black text-slate-900 dark:text-white">{(selectedPatient as any).quantity || "0"} Units</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Info */}
                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date Issued</p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{selectedPatient.issued}</p>
                  </div>
                  {selectedPatient.duration && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Duration</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{selectedPatient.duration}</p>
                    </div>
                  )}
                </div>

                {selectedPatient.instructions && (
                  <div className="p-5 bg-blue-50/50 dark:bg-blue-500/5 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                    <div className="flex items-center gap-2 mb-2">
                      <ClipboardList className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Instructions</p>
                    </div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 italic leading-relaxed">
                      "{selectedPatient.instructions}"
                    </p>
                  </div>
                )}

                {selectedPatient.attachment_url && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <FileImage className="h-3 w-3" />
                        Prescription File
                      </div>
                      <a
                        href={selectedPatient.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest flex items-center gap-1"
                      >
                        Full View <ExternalLink className="h-2 w-2" />
                      </a>
                    </div>

                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 flex items-center justify-center p-2 min-h-[260px]">
                      {selectedPatient.attachment_type?.startsWith("image/") ? (
                        <img
                          src={selectedPatient.attachment_url}
                          alt="Prescription"
                          className="max-w-full h-auto rounded-xl shadow-lg border border-slate-200 dark:border-slate-800"
                        />
                      ) : selectedPatient.attachment_type?.includes("pdf") ? (
                        <div className="flex flex-col items-center gap-3 py-8 w-full">
                          <div className="p-3 bg-rose-500/10 rounded-xl">
                            <FileText className="w-8 h-8 text-rose-500" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">PDF Prescription</p>
                          </div>
                          <a
                            href={selectedPatient.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-2 bg-rose-500 text-white rounded-lg font-bold text-xs hover:bg-rose-600 transition-all shadow-md shadow-rose-500/20"
                          >
                            Open PDF
                          </a>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 py-6">
                          <FileText className="h-6 w-6 text-slate-400" />
                          <a
                            href={selectedPatient.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-blue-600 hover:underline"
                          >
                            View Clinical Attachment
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>

            <div className="p-8 bg-slate-50 dark:bg-slate-950/50 flex flex-col sm:flex-row gap-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" onClick={() => setSelectedPatient(null)} className="flex-1 h-12 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900">
                Close
              </Button>
              <Button className="flex-1 h-12 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs uppercase tracking-widest hover:opacity-90 shadow-lg">
                <Package className="h-4 w-4 mr-2" />
                Print Rx
              </Button>
            </div>
          </Card>
        </div>
      )}
    </main>
  )
}
