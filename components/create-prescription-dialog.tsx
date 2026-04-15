"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, Plus, Trash2, User, History, Pill, Calendar as CalendarIcon } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface Patient {
  id: string
  name: string
}

interface Doctor {
  id: string
  name: string
  email?: string
}

interface MedicationEntry {
  medication: string
  dosage: string
  quantity: string
}

interface CreatePrescriptionDialogProps {
  children: React.ReactNode
  onCreated?: () => void
  preselectedPatientId?: string
  appointmentId?: string
}

export function CreatePrescriptionDialog({ children, onCreated, preselectedPatientId, appointmentId }: CreatePrescriptionDialogProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loadingMetadata, setLoadingMetadata] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [previousPrescriptions, setPreviousPrescriptions] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const [selectedPatientId, setSelectedPatientId] = useState(preselectedPatientId || "")
  const [selectedDoctorId, setSelectedDoctorId] = useState("")
  const [medications, setMedications] = useState<MedicationEntry[]>([
    { medication: "", dosage: "", quantity: "" }
  ])
  const [status, setStatus] = useState("Active")
  const [duration, setDuration] = useState("")
  const [instructions, setInstructions] = useState("")

  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientHistory(selectedPatientId)
    } else {
      setPreviousPrescriptions([])
    }
  }, [selectedPatientId, patients]) // Added patients to dependencies to ensure history is fetched when patients list loads

  const fetchPatientHistory = async (patientId: string) => {
    const patient = patients.find(p => p.id === patientId)
    if (!patient) return

    setLoadingHistory(true)
    try {
      const res = await fetch(`/api/prescriptions?patientId=${patient.id}`)
      if (res.ok) {
        const data = await res.json()
        setPreviousPrescriptions(data)
      }
    } catch (error) {
      console.error("Failed to fetch patient history:", error)
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchMetadata()
    }
  }, [open])

  const fetchMetadata = async () => {
    setLoadingMetadata(true)
    try {
      const [patientsRes, doctorsRes, authRes] = await Promise.all([
        fetch("/api/patients"),
        fetch("/api/doctors"),
        fetch("/api/auth/me")
      ])

      if (patientsRes.ok) {
        const patientsData = await patientsRes.json()
        setPatients(patientsData)
        if (preselectedPatientId) {
          const matched = patientsData.find((p: any) => p.id === preselectedPatientId)
          if (matched) setSelectedPatientId(matched.id)
        }
      }

      let fetchedDoctors: Doctor[] = []
      if (doctorsRes.ok) {
        fetchedDoctors = await doctorsRes.json()
        setDoctors(fetchedDoctors)
      }

      if (authRes.ok) {
        const authData = await authRes.json()
        setCurrentUser(authData.user)
        if (authData.user.role === "DOCTOR") {
          // Try matching by email first, then by name (more robust than strict equality)
          const doctorEmail = authData.user.email?.toLowerCase().trim();
          const doctorName = authData.user.name?.toLowerCase().trim().replace(/^dr\.\s*/i, "");
          
          const doc = fetchedDoctors.find(d => {
            const dEmail = d.email?.toLowerCase().trim();
            const dName = d.name?.toLowerCase().trim().replace(/^dr\.\s*/i, "");
            
            return (doctorEmail && dEmail === doctorEmail) || 
                   (doctorName && dName === doctorName);
          });
          
          if (doc) {
            setSelectedDoctorId(doc.id);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch metadata:", error)
    } finally {
      setLoadingMetadata(false)
    }
  }

  const resetForm = () => {
    setSelectedPatientId(preselectedPatientId || "")
    // Only reset doctor id if current user is not a doctor
    if (currentUser && currentUser.role !== "DOCTOR") {
      setSelectedDoctorId("")
    }
    setMedications([{ medication: "", dosage: "", quantity: "" }])
    setStatus("Active")
    setDuration("")
    setInstructions("")
  }

  const addMedication = () => {
    setMedications([...medications, { medication: "", dosage: "", quantity: "" }])
  }

  const removeMedication = (index: number) => {
    if (medications.length > 1) {
      const newMedications = [...medications]
      newMedications.splice(index, 1)
      setMedications(newMedications)
    }
  }

  const updateMedication = (index: number, field: keyof MedicationEntry, value: string) => {
    const newMedications = [...medications]
    newMedications[index] = { ...newMedications[index], [field]: value }
    setMedications(newMedications)
  }

  const handleSubmit = async () => {
    const patient = patients.find(p => p.id === selectedPatientId)
    const doctor = doctors.find(d => d.id === selectedDoctorId)

    const validMedications = medications.filter(m => m.medication && m.dosage && m.quantity)

    if (!patient || !doctor || validMedications.length === 0) return

    setLoading(true)
    try {
      const res = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: patient.name,
          patientId: patient.id,
          doctorName: doctor.name,
          doctorId: doctor.id,
          medications: validMedications.map(m => ({
            ...m,
            quantity: Number(m.quantity)
          })),
          status,
          duration,
          instructions,
          appointmentId: appointmentId
        }),
      })
      if (res.ok) {
        toast.success("Prescription created successfully")
        setOpen(false)
        resetForm()
        router.refresh()
        onCreated?.()
      } else {
        const errorData = await res.json().catch(() => ({}))
        toast.error(errorData.message || "Failed to create prescription")
      }
    } catch (error) {
      console.error("Failed to create prescription:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl h-[95vh] bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border border-white/20 dark:border-slate-800/50 rounded-[2rem] shadow-2xl overflow-hidden p-0 animate-in fade-in zoom-in-95 duration-300">
        <DialogHeader className="px-8 pt-8 pb-4 bg-slate-500/5 border-b border-slate-200/50 dark:border-slate-800/50">
          <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white">Create New Prescription</DialogTitle>
          <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mt-1.5 px-0.5">Clinical Pharmacy Management</p>
        </DialogHeader>

        <div className="px-8 py-6 space-y-6 h-[calc(95vh-180px)] overflow-y-auto custom-scrollbar">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 min-w-0">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Select Patient</Label>
                <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                  <SelectTrigger className="w-full h-12 rounded-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-[#e05d38]/20 focus:border-[#e05d38] shadow-sm transition-all overflow-hidden">
                    <div className="truncate pr-2">
                      <SelectValue placeholder={loadingMetadata ? "Searching..." : "Choose patient"} />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl">
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="rounded-xl py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{p.name}</span>
                          <span className="text-[10px] opacity-60 font-mono uppercase">ID: {p.id}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(currentUser?.role !== "DOCTOR" || !selectedDoctorId) && (
                <div className="space-y-2 min-w-0">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Prescribing Doctor</Label>
                  <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                    <SelectTrigger className="w-full h-12 rounded-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-[#e05d38]/20 focus:border-[#e05d38] shadow-sm transition-all overflow-hidden">
                      <div className="truncate pr-2">
                        <SelectValue placeholder={loadingMetadata ? "Searching..." : "Choose doctor"} />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl">
                      {doctors.map((d) => (
                        <SelectItem key={d.id} value={d.id} className="rounded-xl py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-[#e05d38]/10 flex items-center justify-center">
                              <User className="h-4 w-4 text-[#e05d38]" />
                            </div>
                            <span className="font-bold text-sm">{d.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Previous Prescriptions History */}
            {selectedPatientId && (
              <div className="space-y-4 p-6 rounded-3xl bg-blue-500/5 border border-blue-200/30 dark:border-blue-800/30">
                <div className="flex items-center gap-2 mb-2">
                  <History className="h-4 w-4 text-[#e05d38]" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Previous Medications</h3>
                </div>

                {loadingHistory ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-[#e05d38]" />
                  </div>
                ) : previousPrescriptions.length > 0 ? (
                  <div className="space-y-3 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                    {previousPrescriptions.map((rx) => (
                      <div key={rx.id || rx._id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
                            <CalendarIcon className="h-3 w-3 text-slate-500" />
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{rx.issued}</span>
                          </div>
                          <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-wider h-6 rounded-full border-none ${rx.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-600'
                            }`}>
                            {rx.status}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          {rx.medications.map((m: any, idx: number) => (
                            <div key={idx} className="flex items-start gap-2.5 group">
                              <div className="h-6 w-6 rounded-lg bg-blue-500/10 flex items-center justify-center mt-0.5">
                                <Pill className="h-3 w-3 text-blue-600" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">{m.medication}</span>
                                <span className="text-[10px] text-slate-500 font-medium">{m.dosage} • {m.quantity} Units</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] font-bold text-slate-400 text-center py-4 italic">No previous records found for this patient.</p>
                )}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between ml-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Medications List</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMedication}
                  className="rounded-full h-9 px-4 text-[10px] font-black uppercase tracking-widest border-blue-500/30 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all font-bold"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Medicine
                </Button>
              </div>

              {medications.map((med, index) => (
                <div key={index} className="p-5 rounded-3xl bg-slate-500/5 border border-slate-200/50 dark:border-slate-800/50 space-y-4 relative group hover:border-blue-500/20 transition-all">
                  {medications.length > 1 && (
                    <button
                      onClick={() => removeMedication(index)}
                      className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:scale-110 active:scale-90"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}

                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Medication {index + 1}</Label>
                    <div className="relative group/input">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within/input:text-[#e05d38] transition-colors" />
                      <Input
                        value={med.medication}
                        onChange={(e) => updateMedication(index, "medication", e.target.value)}
                        className="h-12 border border-slate-200 dark:border-slate-800 focus:ring-[#e05d38]/20 focus:border-[#e05d38] pl-11 rounded-full bg-white dark:bg-slate-900 shadow-sm transition-all"
                        placeholder="e.g., Amoxicillin 500mg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Dosage</Label>
                      <Input
                        value={med.dosage}
                        onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                        className="h-12 border border-slate-200 dark:border-slate-800 focus:ring-[#e05d38]/20 focus:border-[#e05d38] rounded-full bg-white dark:bg-slate-900 shadow-sm transition-all"
                        placeholder="e.g., 2 times daily"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Quantity</Label>
                      <Input
                        type="number"
                        value={med.quantity}
                        onChange={(e) => updateMedication(index, "quantity", e.target.value)}
                        className="h-12 border border-slate-200 dark:border-slate-800 focus:ring-[#e05d38]/20 focus:border-[#e05d38] rounded-full bg-white dark:bg-slate-900 shadow-sm transition-all"
                        placeholder="Count"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 min-w-0">
                <Label htmlFor="status" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Initial Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status" className="w-full h-12 rounded-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-[#e05d38]/20 focus:border-[#e05d38] shadow-sm transition-all">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-800">
                    <SelectItem value="Active" className="rounded-xl py-2.5 font-bold">Active</SelectItem>
                    <SelectItem value="Filled" className="rounded-xl py-2.5 font-bold">Filled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 min-w-0">
                <Label htmlFor="duration" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Treatment Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger id="duration" className="w-full h-12 rounded-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-[#e05d38]/20 focus:border-[#e05d38] shadow-sm transition-all">
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-800">
                    <SelectItem value="1 days" className="rounded-xl py-2.5 font-bold">1 Days</SelectItem>
                    <SelectItem value="2 days" className="rounded-xl py-2.5 font-bold">2 Days</SelectItem>
                    <SelectItem value="3 days" className="rounded-xl py-2.5 font-bold">3 Days</SelectItem>
                    <SelectItem value="5 days" className="rounded-xl py-2.5 font-bold">5 Days</SelectItem>
                    <SelectItem value="1 week" className="rounded-xl py-2.5 font-bold">1 Week</SelectItem>
                    <SelectItem value="2 weeks" className="rounded-xl py-2.5 font-bold">2 Weeks</SelectItem>
                    <SelectItem value="3 weeks" className="rounded-xl py-2.5 font-bold">3 Weeks</SelectItem>
                    <SelectItem value="1 month" className="rounded-xl py-2.5 font-bold">1 Month</SelectItem>
                    <SelectItem value="3 months" className="rounded-xl py-2.5 font-bold">3 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Additional Instructions</Label>
              <Textarea
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Dosage warnings or specific clinical instructions..."
                className="rounded-3xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-[#e05d38]/20 focus:border-[#e05d38] min-h-[120px] resize-none shadow-sm transition-all p-4 font-semibold"
              />
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 sticky bottom-0 z-10 backdrop-blur-sm">
          {(!loading && (!selectedPatientId || !selectedDoctorId || medications.filter(m => m.medication && m.dosage && m.quantity).length === 0)) && (
            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest text-center mb-4 transition-all animate-in fade-in duration-300">
              Required: {!selectedPatientId ? "Select Patient" : !selectedDoctorId ? "Select Doctor" : "Add at least one medicine"}
            </p>
          )}
          <div className="flex gap-4 justify-end">
            <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-full px-6 font-bold text-slate-500 hover:text-slate-900 transition-colors">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !selectedPatientId || !selectedDoctorId || medications.filter(m => m.medication && m.dosage && m.quantity).length === 0}
              className="rounded-full px-10 h-12 bg-[#e05d38] hover:bg-[#c14a27] text-white shadow-xl shadow-[#e05d38]/25 transition-all hover:scale-[1.02] active:scale-[0.98] font-bold"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : "Create Prescription"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
