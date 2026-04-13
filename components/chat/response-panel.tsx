"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, FileText, Users, ImageIcon, Stethoscope } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Task {
  id: string
  name: string
  status: "completed" | "pending" | "error"
  description: string
  timestamp: Date
}

interface PatientResult {
  id: string
  name: string
  phone: string
  diagnosis: string
  found: boolean
  reports: string[]
  matchedData?: Record<string, any>
}

export function ResponsePanel({
  taskResults,
  selectedPatients,
  isLoading,
  isMaximized = false,
}: {
  taskResults: any
  selectedPatients: any[]
  isLoading: boolean
  isMaximized?: boolean
}) {
  const [expandedPatient, setExpandedPatient] = useState<string | null>(null)

  const getDummyTasks = (): Task[] => {
    return [
      {
        id: "1",
        name: "File Uploaded",
        status: "completed",
        description: "Processed patient_report_001.pdf",
        timestamp: new Date(),
      },
      {
        id: "2",
        name: "Extract Patient Information",
        status: "completed",
        description: "Found: Rajesh Kumar (9876543210)",
        timestamp: new Date(),
      },
      {
        id: "3",
        name: "Patient Database Lookup",
        status: "completed",
        description: "Patient found in database",
        timestamp: new Date(),
      },
      {
        id: "4",
        name: "Map Documents to Patient",
        status: "completed",
        description: "Linked report to patient profile",
        timestamp: new Date(),
      },
    ]
  }

  const getDummyResults = () => {
    return {
      "Spine Injury": [
        {
          id: "P001",
          name: "Rajesh Kumar",
          phone: "9876543210",
          age: 45,
          diagnosis: "Spine Injury",
          severity: "Moderate",
          reportType: "MRI",
          date: "2024-12-20",
          reports: [
            { name: "MRI_Spine_001.pdf", type: "PDF", size: "2.4 MB" },
            { name: "X-Ray_Lumbar.pdf", type: "PDF", size: "1.1 MB" },
          ],
          imaging: [
            { name: "mri_spine_001.jpg", type: "Image", size: "3.2 MB" },
            { name: "xray_lumbar_001.jpg", type: "Image", size: "1.8 MB" },
          ],
        },
        {
          id: "P002",
          name: "Priya Nair",
          phone: "8765432109",
          age: 38,
          diagnosis: "Spine Injury",
          severity: "Mild",
          reportType: "CT Scan",
          date: "2024-12-18",
          reports: [{ name: "CT_Spine_002.pdf", type: "PDF", size: "3.1 MB" }],
          imaging: [
            { name: "ct_spine_002_001.jpg", type: "Image", size: "4.5 MB" },
            { name: "ct_spine_002_002.jpg", type: "Image", size: "4.2 MB" },
          ],
        },
        {
          id: "P003",
          name: "Arjun Patel",
          phone: "7654321098",
          age: 52,
          diagnosis: "Spine Injury",
          severity: "Severe",
          reportType: "MRI + CT",
          date: "2024-12-19",
          reports: [
            { name: "MRI_Spine_003.pdf", type: "PDF", size: "2.8 MB" },
            { name: "CT_Spine_003.pdf", type: "PDF", size: "3.5 MB" },
            { name: "Doctor_Notes_003.pdf", type: "PDF", size: "0.5 MB" },
          ],
          imaging: [
            { name: "mri_spine_003_001.jpg", type: "Image", size: "3.8 MB" },
            { name: "mri_spine_003_002.jpg", type: "Image", size: "3.9 MB" },
            { name: "ct_spine_003_001.jpg", type: "Image", size: "4.8 MB" },
          ],
        },
      ],
      "Orthopedic Fracture": [
        {
          id: "P004",
          name: "Meera Gupta",
          phone: "6543210987",
          age: 32,
          diagnosis: "Orthopedic Fracture",
          severity: "Moderate",
          reportType: "X-Ray",
          date: "2024-12-17",
          reports: [{ name: "XRay_Fracture_004.pdf", type: "PDF", size: "1.9 MB" }],
          imaging: [{ name: "xray_fracture_004.jpg", type: "Image", size: "2.1 MB" }],
        },
      ],
    }
  }

  const getTasks = (): Task[] => {
    if (!taskResults) return getDummyTasks()

    const tasks: Task[] = []

    if (taskResults.uploaded) {
      tasks.push({
        id: "1",
        name: "File Uploaded",
        status: "completed",
        description: `Processed ${taskResults.uploaded.fileName}`,
        timestamp: new Date(),
      })
    }

    if (taskResults.extracted) {
      tasks.push({
        id: "2",
        name: "Extract Patient Information",
        status: "completed",
        description: `Found: ${taskResults.extracted.name} (${taskResults.extracted.phone})`,
        timestamp: new Date(),
      })
    }

    if (taskResults.patients && taskResults.patients.length > 0) {
      const found = taskResults.patients.filter((p: any) => p.found).length
      const created = taskResults.patients.filter((p: any) => !p.found).length

      tasks.push({
        id: "3",
        name: "Patient Database Lookup",
        status: "completed",
        description: `${found} found, ${created} created new`,
        timestamp: new Date(),
      })
    }

    if (taskResults.mapped) {
      tasks.push({
        id: "4",
        name: "Map Documents to Patient",
        status: "completed",
        description: `Linked ${taskResults.mapped.count} reports`,
        timestamp: new Date(),
      })
    }

    if (taskResults.error) {
      tasks.push({
        id: "5",
        name: "Error",
        status: "error",
        description: taskResults.error,
        timestamp: new Date(),
      })
    }

    return tasks.length > 0 ? tasks : getDummyTasks()
  }

  const renderTaskIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case "pending":
        return <Clock className="h-5 w-5 text-blue-600" />
      default:
        return null
    }
  }

  const renderPatientCard = (patient: any) => {
    const isExpanded = expandedPatient === patient.id

    return (
      <Card key={patient.id} className="overflow-hidden hover:shadow-md transition-shadow">
        <button
          onClick={() => setExpandedPatient(isExpanded ? null : patient.id)}
          className="w-full text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <CardHeader className={`${isMaximized ? "pb-2" : "pb-3"}`}>
            <div className={`flex ${isMaximized ? "flex-col gap-2" : "items-start justify-between"}`}>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Stethoscope className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <CardTitle className={`${isMaximized ? "text-sm" : "text-base"}`}>{patient.name}</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">{patient.phone}</p>
              </div>
              {!isMaximized && (
                <div className="text-right">
                  <Badge className="mb-2">{patient.severity}</Badge>
                  <p className="text-xs text-muted-foreground">{patient.date}</p>
                </div>
              )}
            </div>
            <div className={`flex gap-2 mt-2 flex-wrap ${isMaximized ? "flex-col sm:flex-row" : ""}`}>
              <Badge variant="outline" className={isMaximized ? "text-xs w-fit" : ""}>
                {patient.diagnosis}
              </Badge>
              <Badge variant="secondary" className={isMaximized ? "text-xs w-fit" : ""}>
                Age: {patient.age}
              </Badge>
              <Badge variant="secondary" className={isMaximized ? "text-xs w-fit" : ""}>
                {patient.reportType}
              </Badge>
              {isMaximized && (
                <>
                  <Badge className="text-xs w-fit">{patient.severity}</Badge>
                  <Badge variant="outline" className="text-xs w-fit">
                    {patient.date}
                  </Badge>
                </>
              )}
            </div>
          </CardHeader>
        </button>

        {isExpanded && (
          <CardContent className="bg-slate-50 dark:bg-slate-900 space-y-4">
            {/* Reports Section */}
            {patient.reports && patient.reports.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Medical Reports ({patient.reports.length})
                </h4>
                <div className={`space-y-2 ${isMaximized ? "grid grid-cols-1 sm:grid-cols-2 gap-2" : ""}`}>
                  {patient.reports.map((report: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-2 bg-white dark:bg-slate-800 rounded border border-border hover:border-blue-300 transition-colors cursor-pointer"
                    >
                      <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{report.name}</p>
                        <p className="text-xs text-muted-foreground">{report.size}</p>
                      </div>
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {report.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Imaging Section */}
            {patient.imaging && patient.imaging.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-purple-600" />
                  Medical Imaging ({patient.imaging.length})
                </h4>
                <div className={`${isMaximized ? "grid grid-cols-2 sm:grid-cols-3 gap-2" : "grid grid-cols-2 gap-2"}`}>
                  {patient.imaging.map((image: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-white dark:bg-slate-800 rounded border border-border hover:border-purple-300 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <ImageIcon className="h-4 w-4 text-purple-500 group-hover:scale-110 transition-transform" />
                        <p className="text-xs font-medium truncate flex-1">{image.name}</p>
                      </div>
                      <div className="h-20 bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900 dark:to-purple-800 rounded flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-purple-300" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">{image.size}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    )
  }

  const renderQueryResults = () => {
    const dummyResults = getDummyResults()
    const resultsToShow = taskResults?.queryResults
      ? taskResults.queryResults.reduce((acc: any, result: any) => {
          const diagnosis = result.diagnosis || "Other"
          if (!acc[diagnosis]) acc[diagnosis] = []
          acc[diagnosis].push(result)
          return acc
        }, {})
      : dummyResults

    return (
      <div className="space-y-4">
        {Object.entries(resultsToShow).map(([diagnosis, results]: [string, any]) => (
          <div key={diagnosis}>
            <div className="mb-3">
              <h3 className={`font-semibold flex items-center gap-2 text-foreground ${isMaximized ? "text-sm" : ""}`}>
                <Users className={`${isMaximized ? "h-4 w-4" : "h-5 w-5"} text-blue-600 flex-shrink-0`} />
                {diagnosis}
                <Badge className={isMaximized ? "text-xs ml-auto" : "ml-2"}>{results.length} Patients</Badge>
              </h3>
            </div>
            <div className={`${isMaximized ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "space-y-3"}`}>
              {results.map((patient: any, idx: number) => renderPatientCard(patient))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Tabs defaultValue="tasks" className="w-full h-full flex flex-col">
      <TabsList className="w-full rounded-none border-b border-border">
        <TabsTrigger value="tasks">Tasks</TabsTrigger>
        <TabsTrigger value="results">Results</TabsTrigger>
      </TabsList>

      <TabsContent value="tasks" className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Processing...</p>
                </div>
              </div>
            ) : (
              getTasks().map((task) => (
                <div
                  key={task.id}
                  className="flex gap-3 p-4 bg-white dark:bg-slate-800 border border-border rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex-shrink-0 pt-0.5">{renderTaskIcon(task.status)}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-foreground">{task.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="results" className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Processing results...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">{renderQueryResults()}</div>
            )}
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  )
}
