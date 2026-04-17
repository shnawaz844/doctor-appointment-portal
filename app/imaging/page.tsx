"use client"

import { useState, useEffect, useCallback } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { FileImage, AlertCircle, CheckCircle2, Eye, Download, Maximize2, FileText, Plus, Loader2, X, Search } from "lucide-react"
import { CreateImagingDialog } from "@/components/create-imaging-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"

interface ImagingStudy {
  id: string
  patient_id: string
  patient_name: string
  study_type: string
  body_part: string
  modality: "X-Ray" | "CT" | "MRI" | "Ultrasound"
  date: string
  month: string
  year: string
  ai_flag?: "Normal" | "Abnormal" | "Requires Review"
  thumbnail: string
  doctor: string
}

export default function ImagingPage() {
  const [studies, setStudies] = useState<ImagingStudy[]>([])
  const [loading, setLoading] = useState(true)
  const [modalityFilter, setModalityFilter] = useState("all")
  const [bodyPartFilter, setBodyPartFilter] = useState("all")
  const [yearFilter, setYearFilter] = useState("all")
  const [doctorFilter, setDoctorFilter] = useState("all")
  const [studyTypeFilter, setStudyTypeFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8
  const [selectedImage, setSelectedImage] = useState<ImagingStudy | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)

  const fetchStudies = useCallback(async () => {
    try {
      const res = await fetch("/api/imaging")
      if (res.ok) {
        const data = await res.json()
        setStudies(data)
      }
    } catch (error) {
      console.error("Failed to fetch imaging studies:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStudies()
  }, [fetchStudies])

  useEffect(() => {
    setCurrentPage(1)
  }, [modalityFilter, bodyPartFilter, yearFilter, doctorFilter, studyTypeFilter, searchQuery])

  // Derive unique body parts, years, doctors, and study types from fetched data
  const uniqueBodyParts = Array.from(new Set(studies.map((s) => s.body_part))).sort()
  const uniqueYears = Array.from(new Set(studies.map((s) => s.year))).sort((a, b) => Number(b) - Number(a))
  const uniqueDoctors = Array.from(new Set(studies.map((s) => s.doctor))).sort()
  const uniqueStudyTypes = Array.from(new Set(studies.map((s) => s.study_type))).sort()

  const filteredStudies = studies.filter((study) => {
    const matchesModality = modalityFilter === "all" || study.modality === modalityFilter
    const matchesBodyPart = bodyPartFilter === "all" || study.body_part === bodyPartFilter
    const matchesYear = yearFilter === "all" || study.year === yearFilter
    const matchesDoctor = doctorFilter === "all" || study.doctor === doctorFilter
    const matchesStudyType = studyTypeFilter === "all" || study.study_type === studyTypeFilter
    const matchesSearch = 
      study.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.id.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesModality && matchesBodyPart && matchesYear && matchesDoctor && matchesStudyType && matchesSearch
  })

  const totalPages = Math.max(1, Math.ceil(filteredStudies.length / itemsPerPage))
  const paginatedStudies = filteredStudies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const openImageView = (study: ImagingStudy) => {
    setSelectedImage(study)
    setShowReport(false)
    setIsDialogOpen(true)
  }

  const getAiFlagColor = (flag?: string) => {
    switch (flag) {
      case "Normal":
        return "bg-chart-3/10 text-chart-3 border-chart-3/30"
      case "Abnormal":
        return "bg-destructive/10 text-destructive border-destructive/30"
      case "Requires Review":
        return "bg-chart-5/10 text-chart-5 border-chart-5/30"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getAiFlagIcon = (flag?: string) => {
    switch (flag) {
      case "Normal":
        return <CheckCircle2 className="h-4 w-4" />
      case "Abnormal":
      case "Requires Review":
        return <AlertCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  return (
    <main className="flex-1">
      <div className="container mx-auto py-6 md:py-8 px-4 md:px-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-4">
          <PageHeader title="Documents & Imaging" description="Browse and manage orthopedic imaging studies" />
          <CreateImagingDialog onCreated={fetchStudies}>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Imaging Study
            </Button>
          </CreateImagingDialog>
        </div>


        {/* Filters and Search */}
        <Card className="mb-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-slate-800">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by patient name or study ID..."
                  className="pl-10 h-11 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-blue-500/20 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Select Filters */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
                <Select value={modalityFilter} onValueChange={setModalityFilter}>
                  <SelectTrigger className="w-full sm:w-[150px] h-11 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl">
                    <SelectValue placeholder="Modality" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-xl">
                    <SelectItem value="all">All Modalities</SelectItem>
                    <SelectItem value="X-Ray">X-Ray</SelectItem>
                    <SelectItem value="CT">CT Scan</SelectItem>
                    <SelectItem value="MRI">MRI</SelectItem>
                    <SelectItem value="Ultrasound">Ultrasound</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={bodyPartFilter} onValueChange={setBodyPartFilter}>
                  <SelectTrigger className="w-full sm:w-[150px] h-11 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl">
                    <SelectValue placeholder="Body Part" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-xl">
                    <SelectItem value="all">All Body Parts</SelectItem>
                    {uniqueBodyParts.map((part) => (
                      <SelectItem key={part} value={part}>
                        {part}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={studyTypeFilter} onValueChange={setStudyTypeFilter}>
                  <SelectTrigger className="w-full sm:w-[150px] h-11 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl">
                    <SelectValue placeholder="Study Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-xl">
                    <SelectItem value="all">All Study Types</SelectItem>
                    {uniqueStudyTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                  <SelectTrigger className="w-full sm:w-[150px] h-11 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl">
                    <SelectValue placeholder="Doctor" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-xl">
                    <SelectItem value="all">All Doctors</SelectItem>
                    {uniqueDoctors.map((doc) => (
                      <SelectItem key={doc} value={doc}>
                        {doc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className="w-full sm:w-[150px] h-11 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-xl">
                    <SelectItem value="all">All Years</SelectItem>
                    {uniqueYears.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>


            <div className="mt-4 text-sm text-muted-foreground">
              {loading
                ? "Loading imaging studies..."
                : `Showing ${filteredStudies.length} imaging ${filteredStudies.length === 1 ? "study" : "studies"}`}
            </div>
          </CardContent>
        </Card>

        {/* Table View */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
            <span className="text-slate-500 dark:text-slate-400 font-medium">Loading imaging studies...</span>
          </div>
        ) : filteredStudies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
            <div className="p-4 bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl mb-4">
              <FileImage className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-lg">No Imaging Studies Found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">Add a new imaging study to start managing data.</p>
          </div>
        ) : (
          <div className="glass-premium rounded-3xl p-4 md:p-8 hover:shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-6 duration-1000">
             <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto bg-white/30 dark:bg-slate-950/30">
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                  <TableRow className="hover:bg-transparent border-slate-200 dark:border-slate-800">
                    <TableHead className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Sr No</TableHead>
                    <TableHead className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Study ID</TableHead>
                    <TableHead className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Patient Name</TableHead>
                    <TableHead className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Study Type</TableHead>
                    <TableHead className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Body Part</TableHead>
                    <TableHead className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Date</TableHead>
                    <TableHead className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Doctor</TableHead>
                    <TableHead className="text-right font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStudies.map((study, index) => (
                    <TableRow key={study.id} className="hover:bg-blue-500/5 dark:hover:bg-blue-400/5 border-slate-100 dark:border-slate-800 transition-colors">
                      <TableCell className="text-xs font-bold text-slate-400">
                        {((currentPage - 1) * itemsPerPage) + index + 1}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{study.id}</TableCell>
                      <TableCell className="font-black text-slate-900 dark:text-white">{study.patient_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <FileImage className="h-3.5 w-3.5 text-slate-500" />
                          </div>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{study.study_type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-slate-600 dark:text-slate-400">{study.body_part}</TableCell>
                      <TableCell className="text-sm font-medium text-slate-600 dark:text-slate-400">{study.date}</TableCell>
                      <TableCell className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Dr. {study.doctor}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" onClick={() => openImageView(study)} className="hover:bg-blue-500/10 hover:text-blue-600 dark:hover:bg-blue-400/10 rounded-xl" title="View Details">
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
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between mt-8 glass-premium p-4 rounded-2xl gap-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing <span className="font-bold">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-bold">{Math.min(currentPage * itemsPerPage, filteredStudies.length)}</span> of <span className="font-bold">{filteredStudies.length}</span> studies
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

      {/* Image View Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedImage?.study_type}</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-4">
              {!showReport ? (
                <div className="relative aspect-16/10 bg-muted rounded-lg overflow-hidden group cursor-pointer" onClick={() => {
                  setIsFullScreen(true)
                  setIsDialogOpen(false)
                }}>
                  <img
                    src={selectedImage.thumbnail || "/placeholder.svg"}
                    alt={selectedImage.study_type}
                    className="w-full h-full object-contain transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="h-10 w-10 text-white" />
                  </div>
                </div>
              ) : (
                <div className="bg-muted rounded-lg p-6 max-h-96 overflow-y-auto">
                  <h3 className="font-semibold text-lg mb-4">Radiology Report</h3>
                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="font-medium text-muted-foreground">Clinical History:</p>
                      <p className="text-foreground mt-1">
                        Patient presents with chronic pain in the {selectedImage.body_part.toLowerCase()} region.
                        Previous conservative treatment with limited improvement.
                      </p>
                    </div>
                    <Separator />
                    <div>
                      <p className="font-medium text-muted-foreground">Technique:</p>
                      <p className="text-foreground mt-1">
                        {selectedImage.modality} imaging of the {selectedImage.body_part.toLowerCase()} was performed
                        using standard protocols.
                      </p>
                    </div>
                    <Separator />
                    <div>
                      <p className="font-medium text-muted-foreground">Findings:</p>
                      <p className="text-foreground mt-1">
                        {selectedImage.ai_flag === "Abnormal"
                          ? `Abnormal findings consistent with degenerative changes. Moderate to severe structural abnormalities noted in the ${selectedImage.body_part.toLowerCase()}.`
                          : selectedImage.ai_flag === "Requires Review"
                            ? `Equivocal findings requiring clinical correlation. Further evaluation recommended.`
                            : `No acute abnormalities detected. Normal anatomical structures visualized in the ${selectedImage.body_part.toLowerCase()}.`}
                      </p>
                    </div>
                    <Separator />
                    <div>
                      <p className="font-medium text-muted-foreground">Impression:</p>
                      <p className="text-foreground mt-1">
                        {selectedImage.ai_flag === "Abnormal"
                          ? "Significant pathology identified. Recommend orthopedic consultation for treatment planning."
                          : selectedImage.ai_flag === "Requires Review"
                            ? "Clinical correlation recommended. Follow-up imaging may be warranted."
                            : "Normal study. No acute findings requiring immediate intervention."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Patient</p>
                  <p className="text-base font-semibold text-foreground">{selectedImage.patient_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Study ID</p>
                  <p className="text-base font-mono text-foreground">{selectedImage.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Modality</p>
                  <Badge variant="outline">{selectedImage.modality}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Body Part</p>
                  <Badge variant="outline">{selectedImage.body_part}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Date</p>
                  <p className="text-base text-foreground">{selectedImage.date}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Doctor Assigned</p>
                  <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">Dr. {selectedImage.doctor}</p>
                </div>
                {selectedImage.ai_flag && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">AI Analysis</p>
                    <Badge
                      variant="outline"
                      className={`${getAiFlagColor(selectedImage.ai_flag)} flex items-center gap-1 w-fit`}
                    >
                      {getAiFlagIcon(selectedImage.ai_flag)}
                      {selectedImage.ai_flag}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => setShowReport(!showReport)}>
                  <FileText className="h-4 w-4 mr-2" />
                  {showReport ? "View Image" : "View Report"}
                </Button>
                <Button variant="outline" className="flex-1 bg-transparent">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Full Screen Overlay */}
      {isFullScreen && selectedImage && (
        <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center p-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              setIsFullScreen(false)
              setIsDialogOpen(true)
            }} 
            className="absolute top-4 right-4 text-white hover:bg-white/10 rounded-full z-[110]"
          >
            <X className="h-8 w-8" />
          </Button>
          <div className="relative w-full h-full flex items-center justify-center">
             <img
                src={selectedImage.thumbnail || "/placeholder.svg"}
                alt={selectedImage.study_type}
                className="max-w-full max-h-full object-contain shadow-2xl"
              />
          </div>
          <div className="absolute bottom-10 left-10 text-white/80 p-6 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10">
            <h2 className="text-2xl font-black mb-1">{selectedImage.study_type}</h2>
            <p className="font-bold text-emerald-400">Dr. {selectedImage.doctor}</p>
            <p className="text-sm opacity-60 mt-2">{selectedImage.patient_name} • {selectedImage.date}</p>
          </div>
        </div>
      )}
    </main>
  )
}
