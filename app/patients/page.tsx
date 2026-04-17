"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, Eye, ChevronLeft, ChevronRight, Plus, Loader2 } from "lucide-react"
import Link from "next/link"
import { AddPatientDialog } from "@/components/add-patient-dialog"
import { Patient } from "@/lib/data"
import { cn } from "@/lib/utils"

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [diagnosisFilter, setDiagnosisFilter] = useState("all")
  const [doctorFilter, setDoctorFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [patients, setPatients] = useState<Patient[]>([])
  const [doctorsList, setDoctorsList] = useState<any[]>([])
  const [specialtiesList, setSpecialtiesList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [pRes, dRes, sRes] = await Promise.all([
        fetch("/api/patients"),
        fetch("/api/doctors"),
        fetch("/api/specialties")
      ])
      const [pData, dData, sData] = await Promise.all([
        pRes.json(),
        dRes.json(),
        sRes.json()
      ])
      setPatients(Array.isArray(pData) ? pData : [])
      setDoctorsList(Array.isArray(dData) ? dData : [])
      setSpecialtiesList(Array.isArray(sData) ? sData : [])
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, diagnosisFilter, doctorFilter])

  // Filter patients
  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.phone && patient.phone.includes(searchTerm))

    const matchesDiagnosis = diagnosisFilter === "all" || patient.diagnosis === diagnosisFilter
    const matchesDoctor = doctorFilter === "all" || patient.doctor === doctorFilter

    return matchesSearch && matchesDiagnosis && matchesDoctor
  })

  const uniqueDoctors = doctorsList.map(d => d.name).filter(Boolean)
  const uniqueDiagnoses = specialtiesList.map(s => s.name).filter(Boolean)

  const getDiagnosisColor = (diagnosis: string | undefined) => {
    if (!diagnosis) return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700"
    const colors = [
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20",
      "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-500/10 dark:text-pink-400 dark:border-pink-500/20",
      "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20",
      "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20"
    ]
    let hash = 0
    for (let i = 0; i < diagnosis.length; i++) {
      hash = diagnosis.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  // Pagination
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedPatients = filteredPatients.slice(startIndex, startIndex + itemsPerPage)

  return (
    <main className="flex-1">
      <div className="container mx-auto py-6 md:py-8 px-4 md:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Patients</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage and view patient records</p>
          </div>
          <AddPatientDialog onSuccess={fetchData}>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Patient
            </Button>
          </AddPatientDialog>
        </div>


        <Card>
          <CardHeader>
            <CardTitle>Patient Records</CardTitle>
            <div className="flex flex-col gap-4 mt-4 md:flex-row md:items-center">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by name, ID, or phone..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Doctors</SelectItem>
                    {uniqueDoctors.map((doc: any) => (
                      <SelectItem key={doc} value={doc}>{doc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={diagnosisFilter} onValueChange={setDiagnosisFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Diagnosis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Diagnoses</SelectItem>
                    {uniqueDiagnoses.map((diag: any) => (
                      <SelectItem key={diag} value={diag}>{diag}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  Showing {filteredPatients.length > 0 ? startIndex + 1 : 0} to{" "}
                  {Math.min(startIndex + itemsPerPage, filteredPatients.length)} of {filteredPatients.length} results
                </div>

                {/* Table */}
                <div className="rounded-lg border border-border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">S.no</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Age</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>Phone NO</TableHead>
                        <TableHead>Diagnosis</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Last Visit</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPatients.length > 0 ? (
                        paginatedPatients.map((patient, index) => (
                          <TableRow key={patient.id}>
                            <TableCell className="font-mono text-[11px] text-muted-foreground">{startIndex + index + 1}</TableCell>
                            <TableCell className="font-medium">{patient.name}</TableCell>
                            <TableCell>{patient.age}</TableCell>
                            <TableCell className="text-muted-foreground">{patient.gender}</TableCell>
                            <TableCell className="text-muted-foreground font-medium">
                              {patient.phone}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn("px-2.5 py-0.5 font-semibold", getDiagnosisColor(patient.diagnosis))}>
                                {patient.diagnosis || "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{patient.doctor}</TableCell>
                            <TableCell className="text-muted-foreground">{patient.lastVisit}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/patients/${patient.id}`}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                            No patients found matching your criteria
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

