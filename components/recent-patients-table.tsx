"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Loader2 } from "lucide-react"
import Link from "next/link"
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
              <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Patient ID</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Name</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Diagnosis</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Doctor</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Last Visit</TableHead>
              <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-slate-500">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.slice(0, 5).map((patient) => (
              <TableRow key={patient.id} className="group/row border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-500/5 transition-colors">
                <TableCell className="font-mono text-xs font-bold text-slate-400">{patient.id}</TableCell>
                <TableCell className="font-bold text-slate-900 dark:text-white">{patient.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-bold bg-blue-500/5 text-blue-600 dark:text-blue-400 border-blue-500/20">
                    {patient.diagnosis}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium text-slate-500 dark:text-slate-400">{patient.doctor}</TableCell>
                <TableCell className="text-slate-500 dark:text-slate-400">{patient.lastVisit}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild className="hover:bg-blue-500 hover:text-white transition-all duration-300 rounded-lg">
                    <Link href={`/patients/${patient.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Profile
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {patients.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-slate-500 font-medium">
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

