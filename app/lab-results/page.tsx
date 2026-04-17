"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, FileText, Eye, X, Plus, Loader2, Search, Paperclip, ExternalLink, ImageIcon } from "lucide-react"
import { CreateLabResultDialog } from "@/components/create-lab-result-dialog"
import { Input } from "@/components/ui/input"

interface LabValue {
  name: string
  result: string
  unit: string
  normalRange: string
}

interface LabResult {
  id: string
  patient_id: string
  patient_name: string
  test_name: string
  test_type?: string
  date: string
  status: "Pending" | "Complete" | "Processing"
  result: string
  interpretation?: string
  values?: LabValue[]
  doctor: string
  attachment_url?: string
  attachment_type?: string
}

export default function LabResultsPage() {
  const [labResults, setLabResults] = useState<LabResult[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<"all" | "Complete" | "Pending">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedResult, setSelectedResult] = useState<LabResult | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 7

  const fetchLabResults = useCallback(async () => {
    try {
      const res = await fetch("/api/lab-results")
      if (res.ok) {
        const data = await res.json()
        setLabResults(data)
      }
    } catch (error) {
      console.error("Failed to fetch lab results:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLabResults()
  }, [fetchLabResults])

  useEffect(() => {
    setCurrentPage(1)
  }, [filterStatus, searchQuery])

  const filteredResults = labResults.filter((result) => {
    const matchesStatus = filterStatus === "all" || result.status === filterStatus
    const matchesSearch = 
      result.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.test_name.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesStatus && matchesSearch
  })

  const totalCount = labResults.length
  const completedCount = labResults.filter((r) => r.status === "Complete").length
  const pendingCount = labResults.filter((r) => r.status === "Pending").length

  const totalPages = Math.max(1, Math.ceil(filteredResults.length / itemsPerPage))
  const paginatedResults = filteredResults.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

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
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Lab Results</h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">View and manage patient laboratory test results</p>
        </div>

        {/* Lab Stats */}
        <div className="grid gap-4 md:gap-8 grid-cols-1 md:grid-cols-3 mb-8 md:mb-10">
          <Card
            className={`group relative overflow-hidden border-none backdrop-blur-xl border-t border-l border-white/40 dark:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 cursor-pointer ${filterStatus === "all" ? "bg-blue-500/20 dark:bg-blue-600/30 shadow-lg shadow-blue-500/10" : "bg-blue-500/10 dark:bg-blue-600/20"
              }`}
            onClick={() => setFilterStatus("all")}
          >
            <div className="absolute inset-0 bg-linear-to-br from-blue-500/20 via-blue-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-[0.2em]">Total Tests</CardTitle>
              <div className="p-2.5 bg-blue-500/20 dark:bg-blue-400/20 rounded-xl group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-lg shadow-blue-500/20">
                <FileText className="h-5 w-5 text-blue-700 dark:text-blue-300 group-hover:text-white transition-colors" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10 pt-4">
              <div className="text-4xl font-black tracking-tight text-blue-900 dark:text-white group-hover:translate-x-1 transition-transform duration-500">
                {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : totalCount.toLocaleString()}
              </div>
              <p className="text-xs font-medium text-blue-700/70 dark:text-blue-300/70 mt-3">All time</p>
            </CardContent>
          </Card>

          <Card
            className={`group relative overflow-hidden border-none backdrop-blur-xl border-t border-l border-white/40 dark:border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-500 cursor-pointer ${filterStatus === "Complete" ? "bg-emerald-500/20 dark:bg-emerald-600/30 shadow-lg shadow-emerald-500/10" : "bg-emerald-500/10 dark:bg-emerald-600/20"
              }`}
            onClick={() => setFilterStatus("Complete")}
          >
            <div className="absolute inset-0 bg-linear-to-br from-emerald-500/20 via-emerald-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-[0.2em]">Completed</CardTitle>
              <div className="p-2.5 bg-emerald-500/20 dark:bg-emerald-400/20 rounded-xl group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500 shadow-lg shadow-emerald-500/20">
                <Badge className="h-5 w-5 bg-transparent border-none p-0">
                  <Plus className="h-5 w-5 text-emerald-700 dark:text-emerald-300 group-hover:text-white transition-colors rotate-45" />
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="relative z-10 pt-4">
              <div className="text-4xl font-black tracking-tight text-emerald-900 dark:text-white group-hover:translate-x-1 transition-transform duration-500">
                {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : completedCount.toLocaleString()}
              </div>
              <p className="text-xs font-medium text-emerald-700/70 dark:text-emerald-300/70 mt-3">Results available</p>
            </CardContent>
          </Card>

          <Card
            className={`group relative overflow-hidden border-none backdrop-blur-xl border-t border-l border-white/40 dark:border-amber-500/30 hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-500 cursor-pointer ${filterStatus === "Pending" ? "bg-amber-500/20 dark:bg-amber-600/30 shadow-lg shadow-amber-500/10" : "bg-amber-500/10 dark:bg-amber-600/20"
              }`}
            onClick={() => setFilterStatus("Pending")}
          >
            <div className="absolute inset-0 bg-linear-to-br from-amber-500/20 via-amber-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-[0.2em]">Pending</CardTitle>
              <div className="p-2.5 bg-amber-500/20 dark:bg-amber-400/20 rounded-xl group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all duration-500 shadow-lg shadow-amber-500/20">
                <Loader2 className="h-5 w-5 text-amber-700 dark:text-amber-300 group-hover:text-white transition-colors animate-pulse" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10 pt-4">
              <div className="text-4xl font-black tracking-tight text-amber-900 dark:text-white group-hover:translate-x-1 transition-transform duration-500">
                {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : pendingCount.toLocaleString()}
              </div>
              <p className="text-xs font-medium text-amber-700/70 dark:text-amber-300/70 mt-3">Awaiting results</p>
            </CardContent>
          </Card>
        </div>

        {/* Lab Results Table */}
        <div className="glass-premium rounded-3xl p-8 hover:shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-6 duration-1000">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div className="flex-1">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Recent Lab Results</h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Detailed overview of diagnostic metrics</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search patient or test..."
                  className="pl-10 h-10 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-blue-500/20 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <CreateLabResultDialog onCreated={fetchLabResults}>
                <Button className="w-full sm:w-auto rounded-xl px-6 bg-[#e05d38] text-white hover:bg-[#c94f2f] hover:scale-105 transition-transform h-10 shadow-lg shadow-[#e05d38]/20">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Lab Result
                </Button>
              </CreateLabResultDialog>
            </div>
          </div>


          <div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-3 font-bold text-slate-500">Loading lab results...</span>
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-slate-300 mb-3" />
                <h3 className="font-black text-slate-900 dark:text-white mb-1">No Lab Results Found</h3>
                <p className="text-sm font-medium text-slate-500">Create the first lab result to get started.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-x-auto bg-white/30 dark:bg-slate-950/30">
                <Table>
                  <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                    <TableRow className="hover:bg-transparent border-slate-200/50 dark:border-slate-800/50">
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 h-12">Sr No</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 h-12">Patient Name</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 h-12">Test Name</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 h-12">Date</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 h-12 text-center">Status</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 h-12">Result</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 h-12 text-right px-6">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedResults.map((result, index) => (
                      <TableRow key={result.id} className="group hover:bg-slate-500/5 transition-colors border-slate-200/50 dark:border-slate-800/50">
                        <TableCell className="text-xs font-bold text-slate-400">
                          {((currentPage - 1) * itemsPerPage) + index + 1}
                        </TableCell>
                        <TableCell className="font-bold text-slate-900 dark:text-white py-4 uppercase">
                          <div className="flex items-center gap-2">
                            {result.patient_name}
                            {result.attachment_url && (
                              <Paperclip className="h-3 w-3 text-blue-500" title="Has attachment" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                              <FileText className="h-3.5 w-3.5 text-blue-500" />
                              {result.test_name}
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-tight">{result.id}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-medium text-slate-500 py-4 font-bold">{result.date}</TableCell>
                        <TableCell className="py-4 text-center">
                          <Badge
                            className={`text-[10px] font-black uppercase tracking-wider rounded-lg px-2.5 py-1 ${result.status === "Complete"
                              ? "bg-emerald-500/10 text-emerald-700 border-emerald-200/50"
                              : result.status === "Processing"
                                ? "bg-blue-500/10 text-blue-700 border-blue-200/50"
                                : "bg-amber-500/10 text-amber-700 border-amber-200/50"
                              }`}
                          >
                            {result.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge variant="outline" className="text-[10px] font-bold border-slate-200 dark:border-slate-800 rounded-lg px-2 shadow-sm">{result.result}</Badge>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 rounded-lg hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all p-0 shadow-sm"
                              onClick={() => setSelectedResult(result)}
                              title="View Report"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              asChild={!!result.attachment_url}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 rounded-lg hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all p-0"
                              disabled={!result.attachment_url}
                            >
                              {result.attachment_url ? (
                                <a href={result.attachment_url} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4" />
                                </a>
                              ) : (
                                <Download className="h-4 w-4 opacity-20" />
                              )}
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
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Showing <span className="font-bold">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-bold">{Math.min(currentPage * itemsPerPage, filteredResults.length)}</span> of <span className="font-bold">{filteredResults.length}</span> results
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

      {/* Report Detail Modal */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{selectedResult.testName}</CardTitle>
                <p className="text-sm text-muted-foreground">Laboratory Report Details</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedResult(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1 text-slate-500 uppercase tracking-widest text-[10px] font-black">Patient Name</p>
                  <p className="font-bold text-slate-900 dark:text-white uppercase">{selectedResult.patient_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1 text-slate-500 uppercase tracking-widest text-[10px] font-black">Report ID</p>
                  <p className="font-mono text-blue-600 dark:text-blue-400 font-bold">{selectedResult.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1 text-slate-500 uppercase tracking-widest text-[10px] font-black">Date of Test</p>
                  <p className="font-bold text-slate-700 dark:text-slate-300">{selectedResult.date}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1 text-slate-500 uppercase tracking-widest text-[10px] font-black">Overall Status</p>
                  <Badge variant="outline" className="font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800">
                    {selectedResult.status}
                  </Badge>
                </div>
              </div>

              {selectedResult.interpretation && (
                <div className="space-y-2">
                  <h4 className="font-medium">Clinical Interpretation</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedResult.interpretation}
                  </p>
                </div>
              )}

              {selectedResult.values && selectedResult.values.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Metric Analysis</h4>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Parameter</TableHead>
                          <TableHead>Result</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>Normal Range</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedResult.values.map((value, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{value.name}</TableCell>
                            <TableCell>{value.result}</TableCell>
                            <TableCell className="text-muted-foreground">{value.unit}</TableCell>
                            <TableCell className="text-muted-foreground">{value.normalRange}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {selectedResult.attachment_url && (
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
                  <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-blue-500" />
                    Attached Report
                  </h4>
                  <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                      {selectedResult.attachment_type?.startsWith("image/") ? (
                        <ImageIcon className="h-5 w-5 text-blue-600" />
                      ) : (
                        <FileText className="h-5 w-5 text-rose-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {selectedResult.attachment_type?.split("/")[1].toUpperCase() || "FILE"} Document
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">Click to view or download</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl h-9 bg-white border-slate-200 hover:bg-slate-50 shadow-sm"
                      onClick={() => {
                        if (selectedResult.attachment_type?.startsWith("image/")) {
                          setPreviewUrl(selectedResult.attachment_url!);
                        } else {
                          window.open(selectedResult.attachment_url, "_blank");
                        }
                      }}
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setSelectedResult(null)}>
                  Dismiss
                </Button>
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewUrl && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-300"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-w-5xl w-full flex flex-col items-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-12 right-0 text-white hover:bg-white/10 rounded-full"
              onClick={() => setPreviewUrl(null)}
            >
              <X className="h-8 w-8" />
            </Button>
            <div className="bg-white p-2 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="max-h-[80vh] w-auto rounded-2xl object-contain mx-auto"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="mt-6 flex gap-4">
              <Button 
                asChild
                className="rounded-full px-8 bg-blue-600 hover:bg-blue-700 shadow-xl"
              >
                <a href={previewUrl} download>
                  <Download className="h-4 w-4 mr-2" />
                  Download Image
                </a>
              </Button>
              <Button 
                variant="outline"
                className="rounded-full px-8 bg-white/10 text-white border-white/20 hover:bg-white/20"
                onClick={() => setPreviewUrl(null)}
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
