"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pill, Package, X, Eye } from "lucide-react"

const mockPatientMedications: { [key: string]: any } = {
  P001: {
    patientName: "Rajesh Kumar",
    doctor: "Dr. Sharma",
    medications: [
      {
        id: "M001",
        name: "Ibuprofen 400mg",
        dosage: "1 tablet twice daily",
        quantity: 30,
        issued: "2024-12-15",
        status: "Active",
      },
      {
        id: "M002",
        name: "Calcium Supplement",
        dosage: "1 tablet daily",
        quantity: 60,
        issued: "2024-12-10",
        status: "Active",
      },
      {
        id: "M003",
        name: "Vitamin D3 1000IU",
        dosage: "1 tablet daily",
        quantity: 60,
        issued: "2024-12-05",
        status: "Filled",
      },
    ],
  },
  P002: {
    patientName: "Priya Nair",
    doctor: "Dr. Singh",
    medications: [
      {
        id: "M004",
        name: "Muscle Relaxant",
        dosage: "1 tablet at night",
        quantity: 15,
        issued: "2024-12-18",
        status: "Filled",
      },
      {
        id: "M005",
        name: "Pain Relief Cream",
        dosage: "Apply twice daily",
        quantity: 2,
        issued: "2024-12-15",
        status: "Active",
      },
      {
        id: "M006",
        name: "Sleeping Aid",
        dosage: "1 tablet at night",
        quantity: 30,
        issued: "2024-12-10",
        status: "Active",
      },
    ],
  },
  P003: {
    patientName: "Arjun Patel",
    doctor: "Dr. Verma",
    medications: [
      {
        id: "M007",
        name: "Physical Therapy Cream",
        dosage: "Apply 3 times daily",
        quantity: 1,
        issued: "2024-12-19",
        status: "Active",
      },
      {
        id: "M008",
        name: "Anti-inflammatory Gel",
        dosage: "Apply twice daily",
        quantity: 2,
        issued: "2024-12-15",
        status: "Filled",
      },
      {
        id: "M009",
        name: "Warm Compress Support",
        dosage: "As needed",
        quantity: 5,
        issued: "2024-12-10",
        status: "Active",
      },
    ],
  },
  P004: {
    patientName: "Meera Gupta",
    doctor: "Dr. Sharma",
    medications: [
      {
        id: "M010",
        name: "Vitamin D3 1000IU",
        dosage: "1 tablet daily",
        quantity: 60,
        issued: "2024-12-20",
        status: "Filled",
      },
      {
        id: "M011",
        name: "Multivitamin",
        dosage: "1 tablet daily",
        quantity: 90,
        issued: "2024-12-15",
        status: "Active",
      },
    ],
  },
  P005: {
    patientName: "Vikram Desai",
    doctor: "Dr. Singh",
    medications: [
      {
        id: "M012",
        name: "Paracetamol 500mg",
        dosage: "1-2 tablets as needed",
        quantity: 20,
        issued: "2024-12-14",
        status: "Active",
      },
      {
        id: "M013",
        name: "Antibiotic Cream",
        dosage: "Apply once daily",
        quantity: 1,
        issued: "2024-12-10",
        status: "Filled",
      },
    ],
  },
}

// Mock pharmacy data
const mockPrescriptions = [
  {
    id: "RX001",
    patientName: "Rajesh Kumar",
    patientId: "P001",
    medication: "Ibuprofen 400mg",
    dosage: "1 tablet twice daily",
    quantity: 30,
    issued: "2024-12-15",
    status: "Active",
  },
  {
    id: "RX002",
    patientName: "Priya Nair",
    patientId: "P002",
    medication: "Muscle Relaxant",
    dosage: "1 tablet at night",
    quantity: 15,
    issued: "2024-12-18",
    status: "Filled",
  },
  {
    id: "RX003",
    patientName: "Arjun Patel",
    patientId: "P003",
    medication: "Physical Therapy Cream",
    dosage: "Apply 3 times daily",
    quantity: 1,
    issued: "2024-12-19",
    status: "Active",
  },
  {
    id: "RX004",
    patientName: "Meera Gupta",
    patientId: "P004",
    medication: "Vitamin D3 1000IU",
    dosage: "1 tablet daily",
    quantity: 60,
    issued: "2024-12-20",
    status: "Filled",
  },
  {
    id: "RX005",
    patientName: "Vikram Desai",
    patientId: "P005",
    medication: "Paracetamol 500mg",
    dosage: "1-2 tablets as needed",
    quantity: 20,
    issued: "2024-12-14",
    status: "Active",
  },
]

export default function PharmacyPage() {
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "filled" | "refills">("all")
  const [showAllModal, setShowAllModal] = useState(false)
  const [selectedPatientMeds, setSelectedPatientMeds] = useState<string | null>(null)

  const filteredPrescriptions = mockPrescriptions.filter((rx) => {
    if (filterStatus === "active") return rx.status === "Active"
    if (filterStatus === "filled") return rx.status === "Filled"
    if (filterStatus === "refills") return true
    return true
  })

  return (
    <main className="flex-1">
      <div className="container py-8 px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Pharmacy</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage prescriptions and medications</p>
        </div>

        {/* Pharmacy Stats */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => setFilterStatus("active")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Prescriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-muted-foreground mt-1">Currently active</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => setFilterStatus("filled")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Filled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">342</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => setFilterStatus("refills")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Refills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">23</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
            </CardContent>
          </Card>
        </div>

        {/* Prescriptions Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Recent Prescriptions</CardTitle>
            <Button onClick={() => setShowAllModal(true)} size="sm">
              View All Prescriptions
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient Name</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Medication</TableHead>
                    <TableHead>Dosage</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Issued Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrescriptions.slice(0, 4).map((rx) => (
                    <TableRow key={rx.id}>
                      <TableCell className="font-medium">{rx.patientName}</TableCell>
                      <TableCell className="font-mono text-sm">{rx.patientId}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Pill className="h-4 w-4 text-muted-foreground" />
                          {rx.medication}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{rx.dosage}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          {rx.quantity}
                        </div>
                      </TableCell>
                      <TableCell>{rx.issued}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            rx.status === "Filled" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                          }
                        >
                          {rx.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedPatientMeds(rx.patientId)}
                          title="View all prescribed medicines"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View All Prescriptions Modal */}
      {showAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 sticky top-0 bg-background">
              <CardTitle>All Prescriptions</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowAllModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient Name</TableHead>
                      <TableHead>Medication</TableHead>
                      <TableHead>Dosage</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Issued Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockPrescriptions.map((rx) => (
                      <TableRow key={rx.id}>
                        <TableCell className="font-medium">{rx.patientName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Pill className="h-4 w-4 text-muted-foreground" />
                            {rx.medication}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{rx.dosage}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            {rx.quantity}
                          </div>
                        </TableCell>
                        <TableCell>{rx.issued}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              rx.status === "Filled" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                            }
                          >
                            {rx.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedPatientMeds && mockPatientMedications[selectedPatientMeds] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 sticky top-0 bg-background border-b">
              <div>
                <CardTitle>Prescribed Medications</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {mockPatientMedications[selectedPatientMeds].patientName} - Doctor:{" "}
                  {mockPatientMedications[selectedPatientMeds].doctor}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedPatientMeds(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Medication</TableHead>
                      <TableHead>Dosage</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Issued Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableHeader>
                    <TableBody>
                      {mockPatientMedications[selectedPatientMeds].medications.map((med: any) => (
                        <TableRow key={med.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Pill className="h-4 w-4 text-muted-foreground" />
                              {med.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{med.dosage}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              {med.quantity}
                            </div>
                          </TableCell>
                          <TableCell>{med.issued}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                med.status === "Filled" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                              }
                            >
                              {med.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </TableHeader>
                </Table>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                <Button variant="outline" onClick={() => setSelectedPatientMeds(null)}>
                  Close
                </Button>
                <Button>
                  <Package className="h-4 w-4 mr-2" />
                  Print Medications
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  )
}
