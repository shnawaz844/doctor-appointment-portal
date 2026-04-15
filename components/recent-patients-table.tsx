"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { Patient } from "@/lib/data"

export function RecentPatientsTable() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPatients() {
      try {
        const response = await fetch("/api/patients")
        const data = await response.json()
        setPatients(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Failed to fetch patients:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchPatients()
  }, [])

  return (
    <div className="w-full overflow-auto">
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-slate-200/50 dark:border-slate-800/50">
              <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Name</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Diagnosis</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Doctor</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Last Visit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.slice(0, 5).map((patient) => (
              <TableRow key={patient.id} className="group/row border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-500/5 transition-colors">
                <TableCell className="font-bold text-slate-900 dark:text-white">{patient.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-bold bg-blue-500/5 text-blue-600 dark:text-blue-400 border-blue-500/20">
                    {patient.diagnosis}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium text-slate-500 dark:text-slate-400">{patient.doctor}</TableCell>
                <TableCell className="text-slate-500 dark:text-slate-400">{patient.lastVisit}</TableCell>
              </TableRow>
            ))}
            {patients.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-slate-500 font-medium">
                  No patient records found in the database.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

