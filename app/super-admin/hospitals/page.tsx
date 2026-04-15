"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Loader2, MapPin, Phone, Building2, Edit, LayoutDashboard, UserPlus } from "lucide-react"
import { AddHospitalDialog } from "@/components/add-hospital-dialog"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function HospitalsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [hospitals, setHospitals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchHospitals = async () => {
    try {
      const res = await fetch("/api/hospitals")
      const data = await res.json()
      setHospitals(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to fetch hospitals:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHospitals()
  }, [])

  const filteredHospitals = hospitals.filter((h) =>
    h.hospital_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (h.location && h.location.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <main className="flex-1">
      <div className="container mx-auto py-6 md:py-8 px-4 md:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Hospitals / Clinics</h1>
            <p className="mt-1 text-sm text-muted-foreground">Onboard and manage medical facilities</p>
          </div>
          <AddHospitalDialog onSuccess={fetchHospitals}>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Facility
            </Button>
          </AddHospitalDialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
              <CardTitle>Registered Facilities</CardTitle>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search hospitals or locations..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="rounded-lg border border-border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Facility Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Onboarded At</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHospitals.length > 0 ? (
                      filteredHospitals.map((hospital) => (
                        <TableRow key={hospital.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded bg-primary/10 text-primary">
                                <Building2 className="h-4 w-4" />
                              </div>
                              {hospital.hospital_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-muted-foreground text-sm">
                              <MapPin className="h-3 w-3" />
                              {hospital.location || "N/A"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-muted-foreground text-sm">
                              <Phone className="h-3 w-3" />
                              {hospital.phone_number || "N/A"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={hospital.status === "Active" ? "default" : "secondary"}
                              className={cn(
                                hospital.status === "Active" 
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                                  : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20"
                              )}
                            >
                              {hospital.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(hospital.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/signup?hospitalId=${hospital.id}&hospitalName=${encodeURIComponent(
                                  hospital.hospital_name
                                )}`}
                              >
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="border-emerald-500/20 hover:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                                >
                                  <UserPlus className="h-4 w-4 mr-1" />
                                  Create Admin
                                </Button>
                              </Link>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="border-primary/20 hover:bg-primary/5 text-primary"
                                onClick={async () => {
                                  const res = await fetch("/api/auth/switch-hospital", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ hospital_id: hospital.id })
                                  })
                                  if (res.ok) {
                                    router.push("/")
                                    router.refresh()
                                  }
                                }}
                              >
                                <LayoutDashboard className="h-4 w-4 mr-1" />
                                Manage Data
                              </Button>
                              <AddHospitalDialog hospital={hospital} onSuccess={fetchHospitals}>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                              </AddHospitalDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No facilities found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
