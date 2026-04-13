"use client"

import { useState, useEffect, useCallback } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { FileImage, AlertCircle, CheckCircle2, Eye, Download, Maximize2, FileText, Plus, Loader2 } from "lucide-react"
import { CreateImagingDialog } from "@/components/create-imaging-dialog"

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
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6
  const [selectedImage, setSelectedImage] = useState<ImagingStudy | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [showReport, setShowReport] = useState(false)

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
  }, [modalityFilter, bodyPartFilter, yearFilter])

  // Derive unique body parts and years from fetched data
  const uniqueBodyParts = Array.from(new Set(studies.map((s) => s.body_part))).sort()
  const uniqueYears = Array.from(new Set(studies.map((s) => s.year))).sort((a, b) => Number(b) - Number(a))

  const filteredStudies = studies.filter((study) => {
    const matchesModality = modalityFilter === "all" || study.modality === modalityFilter
    const matchesBodyPart = bodyPartFilter === "all" || study.body_part === bodyPartFilter
    const matchesYear = yearFilter === "all" || study.year === yearFilter
    return matchesModality && matchesBodyPart && matchesYear
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


        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
              <Select value={modalityFilter} onValueChange={setModalityFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Modality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modalities</SelectItem>
                  <SelectItem value="X-Ray">X-Ray</SelectItem>
                  <SelectItem value="CT">CT Scan</SelectItem>
                  <SelectItem value="MRI">MRI</SelectItem>
                  <SelectItem value="Ultrasound">Ultrasound</SelectItem>
                </SelectContent>
              </Select>

              <Select value={bodyPartFilter} onValueChange={setBodyPartFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Body Part" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Body Parts</SelectItem>
                  {uniqueBodyParts.map((part) => (
                    <SelectItem key={part} value={part}>
                      {part}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {uniqueYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>


            <div className="mt-4 text-sm text-muted-foreground">
              {loading
                ? "Loading imaging studies..."
                : `Showing ${filteredStudies.length} imaging ${filteredStudies.length === 1 ? "study" : "studies"}`}
            </div>
          </CardContent>
        </Card>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground text-lg">Loading imaging studies...</span>
          </div>
        ) : filteredStudies.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {paginatedStudies.map((study) => (
              <Card key={study.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div
                  className="relative h-48 bg-muted group cursor-pointer"
                  onClick={() => openImageView(study)}
                >
                  <img
                    src={study.thumbnail || "/placeholder.svg"}
                    alt={study.study_type}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="secondary" size="sm">
                      <Maximize2 className="h-4 w-4 mr-2" />
                      View Full Size
                    </Button>
                  </div>
                  {study.ai_flag && (
                    <Badge
                      variant="outline"
                      className={`absolute top-3 right-3 ${getAiFlagColor(study.ai_flag)} flex items-center gap-1`}
                    >
                      {getAiFlagIcon(study.ai_flag)}
                      {study.ai_flag}
                    </Badge>
                  )}
                </div>

                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground mb-1">{study.study_type}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{study.patient_name}</p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="outline">{study.modality}</Badge>
                    <Badge variant="outline">{study.body_part}</Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span>{study.date}</span>
                    <span className="font-mono">{study.id}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      onClick={() => openImageView(study)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-24 text-center">
              <FileImage className="h-20 w-20 mx-auto text-muted-foreground opacity-20 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Imaging Studies Found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or add a new imaging study.</p>
            </CardContent>
          </Card>
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
                <div className="relative aspect-16/10 bg-muted rounded-lg overflow-hidden">
                  <img
                    src={selectedImage.thumbnail || "/placeholder.svg"}
                    alt={selectedImage.study_type}
                    className="w-full h-full object-contain"
                  />
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
    </main>
  )
}
