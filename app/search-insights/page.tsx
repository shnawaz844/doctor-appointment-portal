"use client"

import { useState } from "react"

import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Search, Filter, Calendar, FileText, Sparkles, ExternalLink, Brain, TrendingUp, Activity } from "lucide-react"
import Link from "next/link"
import { extendedSearchResults } from "@/lib/data"
import { format } from "date-fns"

export default function SearchInsightsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [documentTypeFilter, setDocumentTypeFilter] = useState("all")
  const [diagnosisFilter, setDiagnosisFilter] = useState("all")
  const [selectedResult, setSelectedResult] = useState<any | null>(null)
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()

  const filteredResults = extendedSearchResults.filter((result) => {
    const matchesSearch =
      result.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.aiTerms.some((term) => term.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesDocType = documentTypeFilter === "all" || result.documentType === documentTypeFilter
    const matchesDiagnosis = diagnosisFilter === "all" || result.diagnosis === diagnosisFilter

    const resultDate = new Date(result.date)
    const matchesDateFrom = !dateFrom || resultDate >= dateFrom
    const matchesDateTo = !dateTo || resultDate <= dateTo

    return matchesSearch && matchesDocType && matchesDiagnosis && matchesDateFrom && matchesDateTo
  })

  return (
    <main className="flex-1">
      <div className="container py-8 px-8">
        <PageHeader
          title="Search Insights"
          description="AI-powered document classification and metadata extraction for orthopedic records"
        />

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Advanced AI Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by patient, diagnosis, extracted terms, or OCR content..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <Select value={documentTypeFilter} onValueChange={setDocumentTypeFilter}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Document Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="X-Ray">X-Ray</SelectItem>
                  <SelectItem value="MRI">MRI</SelectItem>
                  <SelectItem value="CT-Scan">CT-Scan</SelectItem>
                  <SelectItem value="Ultrasound">Ultrasound</SelectItem>
                  <SelectItem value="Physical Therapy">Physical Therapy</SelectItem>
                  <SelectItem value="Surgical Notes">Surgical Notes</SelectItem>
                </SelectContent>
              </Select>

              <Select value={diagnosisFilter} onValueChange={setDiagnosisFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Diagnosis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Diagnoses</SelectItem>
                  <SelectItem value="Knee Osteoarthritis">Knee Osteoarthritis</SelectItem>
                  <SelectItem value="Lumbar Disc Herniation">Lumbar Disc Herniation</SelectItem>
                  <SelectItem value="Rotator Cuff Tear">Rotator Cuff Tear</SelectItem>
                  <SelectItem value="Cervical Spondylosis">Cervical Spondylosis</SelectItem>
                  <SelectItem value="Ankle Fracture">Ankle Fracture</SelectItem>
                  <SelectItem value="Meniscal Tear">Meniscal Tear</SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    {dateFrom || dateTo
                      ? `${dateFrom ? format(dateFrom, "MMM dd") : "Start"} - ${dateTo ? format(dateTo, "MMM dd") : "End"}`
                      : "Time Range"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="start">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">From Date</p>
                      <CalendarComponent mode="single" selected={dateFrom} onSelect={setDateFrom} />
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-2">To Date</p>
                      <CalendarComponent mode="single" selected={dateTo} onSelect={setDateTo} />
                    </div>
                    <Button
                      variant="outline"
                      className="w-full bg-transparent"
                      onClick={() => {
                        setDateFrom(undefined)
                        setDateTo(undefined)
                      }}
                    >
                      Clear Filter
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Results Count */}
            <div className="text-sm text-muted-foreground">
              Found {filteredResults.length} documents with AI insights
            </div>
          </CardContent>
        </Card>

        {/* Results Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: Search Results */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Search Results</h2>
            {filteredResults.length > 0 ? (
              filteredResults.map((result) => (
                <Card
                  key={result.id}
                  className={`cursor-pointer transition-colors hover:bg-accent/50 ${selectedResult?.id === result.id ? "ring-2 ring-primary" : ""
                    }`}
                  onClick={() => setSelectedResult(result)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium text-foreground">{result.patientName}</p>
                          <p className="text-xs text-muted-foreground font-mono">{result.patientId}</p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`${result.confidence >= 0.9
                          ? "bg-chart-3/10 text-chart-3 border-chart-3/30"
                          : "bg-chart-5/10 text-chart-5 border-chart-5/30"
                          }`}
                      >
                        {(result.confidence * 100).toFixed(0)}% confidence
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">AI Category:</span>
                        <Badge variant="secondary">{result.aiCategory}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Diagnosis:</span>
                        <Badge variant="outline">{result.diagnosis}</Badge>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {result.aiTerms.slice(0, 3).map((term) => (
                        <Badge key={term} variant="outline" className="text-xs bg-transparent">
                          {term}
                        </Badge>
                      ))}
                    </div>

                    <p className="text-xs text-muted-foreground mt-3">{result.date}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-3" />
                  <p className="text-muted-foreground">No results found. Try adjusting your search criteria.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Preview Panel */}
          <div className="lg:sticky lg:top-8 h-fit">
            {selectedResult ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      AI Document Insights
                    </span>
                    <Link href={`/patients/${selectedResult.patientId}`}>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Open Profile
                      </Button>
                    </Link>
                  </CardTitle>
                  <CardDescription>{selectedResult.patientName}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* AI Prediction */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-foreground">AI-Predicted Category</h3>
                    </div>
                    <Badge className="text-sm">{selectedResult.aiCategory}</Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      Confidence: {(selectedResult.confidence * 100).toFixed(1)}%
                    </p>
                  </div>

                  <Separator />

                  {/* Extracted Fields */}
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">Extracted Medical Fields</h3>
                    <div className="space-y-3">
                      {Object.entries(selectedResult.extractedFields).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-start p-3 rounded-lg bg-muted/50">
                          <span className="text-sm font-medium text-muted-foreground">{key}</span>
                          <span className="text-sm font-semibold text-foreground">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* AI Terms */}
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">AI-Extracted Terms</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedResult.aiTerms.map((term) => (
                        <Badge key={term} variant="secondary">
                          {term}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* File Location */}
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">File Location</h3>
                    <p className="text-sm text-muted-foreground font-mono bg-muted/50 p-3 rounded-lg">
                      {selectedResult.path}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button className="flex-1">Analyze with AI</Button>
                    <Button variant="outline" className="flex-1 bg-transparent">
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-24 text-center">
                  <FileText className="h-16 w-16 mx-auto text-muted-foreground opacity-30 mb-4" />
                  <p className="text-muted-foreground">Select a search result to view AI insights</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
