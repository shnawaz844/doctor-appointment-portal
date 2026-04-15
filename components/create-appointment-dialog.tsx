"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export function CreateAppointmentDialog({ children, onSuccess, preselectedPatientId }: { children: React.ReactNode, onSuccess?: () => void, preselectedPatientId?: string }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)

  const [formData, setFormData] = useState({
    patientName: "",
    phone: "",
    age: "",
    gender: "",
    diagnosis: "",
    date: new Date().toISOString().split("T")[0],
    time: "",
    doctor: "",
    specialty: "",
    visitType: "",
    notes: "",
  })

  const [doctors, setDoctors] = useState<any[]>([])
  const [specialties, setSpecialties] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
    if (open) {
      async function fetchData() {
        try {
          const [patientsRes, doctorsRes, specialtiesRes, userRes] = await Promise.all([
            fetch("/api/patients"),
            fetch("/api/doctors"),
            fetch("/api/specialties"),
            fetch("/api/auth/me")
          ])
          const [patientsData, doctorsData, specialtiesData, userData] = await Promise.all([
            patientsRes.json(),
            doctorsRes.json(),
            specialtiesRes.json(),
            userRes.json()
          ])
          setPatients(Array.isArray(patientsData) ? patientsData : [])
          if (userData?.user) {
            setCurrentUser(userData.user)
          }
          if (preselectedPatientId && Array.isArray(patientsData)) {
            const matched = patientsData.find((p: any) => p.id === preselectedPatientId || p._id === preselectedPatientId)
            if (matched) {
              setFormData(prev => ({ ...prev, patientName: matched.name, phone: matched.phone || "" }))
            }
          }
          const doctorsArray = Array.isArray(doctorsData) ? doctorsData : []
          const specialtiesArray = Array.isArray(specialtiesData) ? specialtiesData : []
          setDoctors(doctorsArray)
          setSpecialties(specialtiesArray)

          if (userData?.user?.role === "DOCTOR") {
            const user = userData.user;
            const doctorEmail = user.email?.toLowerCase().trim();
            const doctorName = user.name?.toLowerCase().trim().replace(/^dr\.\s*/i, "");

            const foundDoctor = doctorsArray.find(d => {
              const dEmail = d.email?.toLowerCase().trim();
              const dName = d.name?.toLowerCase().trim().replace(/^dr\.\s*/i, "");
              return (doctorEmail && dEmail === doctorEmail) || (doctorName && dName === doctorName);
            });

            if (foundDoctor) {
              const spec = specialtiesArray.find(s => s.id === foundDoctor.specialty_id)
              setFormData(prev => ({
                ...prev,
                doctor: foundDoctor.name,
                specialty: spec ? spec.name : ""
              }))
            } else {
              // Fallback to user name
              setFormData(prev => ({
                ...prev,
                doctor: user.name
              }))
            }
          }
        } catch (error) {
          console.error("Failed to fetch data:", error)
        }
      }
      fetchData()
    }
  }, [open])

  const handleDoctorChange = (doctorName: string) => {
    const foundDoctor = doctors.find(d => d.name === doctorName)
    let specName = ""
    if (foundDoctor) {
      const spec = specialties.find(s => s.id === foundDoctor.specialty_id)
      if (spec) specName = spec.name
    }
    setFormData({ ...formData, doctor: doctorName, specialty: specName })
  }

  // No longer filtering doctors by specialty since specialty is derived from doctor
  const filteredDoctors = doctors

  const normalizePhone = (phone: string) => {
    return phone?.replace(/^\+91\s?/, "").replace(/\s/g, "").trim()
  }

  const existingPatient = patients.find(p =>
    p.name?.toLowerCase() === formData.patientName?.trim().toLowerCase() &&
    normalizePhone(p.phone) === normalizePhone(formData.phone)
  )

  const isNewPatient = formData.patientName && formData.phone && !existingPatient

  const handleSubmit = async () => {
    if (!formData.patientName || !formData.phone || !formData.date || !formData.time || !formData.doctor || !formData.visitType || !formData.specialty) {
      alert("Please fill in all required fields")
      return
    }

    if (isNewPatient && (!formData.age || !formData.gender || !formData.diagnosis)) {
      alert("Please fill in all patient details for the new patient")
      return
    }

    setLoading(true)
    try {
      let patientId = existingPatient?.id
      let patientName = existingPatient?.name || formData.patientName
      let patientPhone = existingPatient?.phone || formData.phone

      if (isNewPatient) {
        // Create new patient
        const now = new Date()
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

        const patientPayload = {
          id: `P${Math.floor(1000 + Math.random() * 9000)}`,
          name: formData.patientName,
          age: Number(formData.age),
          gender: formData.gender,
          phone: formData.phone,
          diagnosis: formData.diagnosis,
          doctor: formData.doctor,
          lastVisit: now.toISOString().split('T')[0],
          reportType: "Check-up", // Default
          year: now.getFullYear().toString(),
          month: months[now.getMonth()],
          laterality: "Bilateral",
          severity: "Mild",
          injuryDate: now.toISOString().split('T')[0],
          surgeryRequired: false,
          physicalTherapy: false,
        }

        const patientResponse = await fetch("/api/patients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patientPayload),
        })

        if (!patientResponse.ok) {
          throw new Error("Failed to create patient")
        }

        const newPatient = await patientResponse.json()
        patientId = newPatient.id
        patientName = newPatient.name
        patientPhone = newPatient.phone
      }

      // Create appointment
      const appointmentPayload = {
        id: `APT${Math.floor(1000 + Math.random() * 9000)}`,
        patientName: patientName,
        patientId: patientId,
        date: formData.date,
        time: formData.time,
        doctor: formData.doctor,
        specialty: formData.specialty,
        type: formData.visitType,
        status: "Scheduled",
        phone: patientPhone,
        notes: formData.notes
      }

      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointmentPayload),
      })

      if (response.ok) {
        setOpen(false)
        setFormData({
          patientName: "",
          phone: "",
          age: "",
          gender: "",
          diagnosis: "",
          date: new Date().toISOString().split("T")[0],
          time: "",
          doctor: "",
          specialty: "",
          visitType: "",
          notes: "",
        })
        router.refresh()
        if (onSuccess) onSuccess()
      } else {
        alert("Failed to create appointment")
      }
    } catch (error: any) {
      console.error("Error:", error)
      alert(error.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return <>{children}</>

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl p-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <DialogHeader className="px-8 pt-8 pb-4 border-b border-slate-100 dark:border-slate-800">
          <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white">Create New Appointment</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 p-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Patient Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patientName" className="text-xs font-bold text-slate-700 dark:text-slate-300">Patient Name *</Label>
                <Input
                  id="patientName"
                  list="patient-names"
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                  placeholder="Enter or select name"
                  className="h-11 rounded-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <datalist id="patient-names">
                  {patients.map(p => (
                    <option key={p.id} value={p.name} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-bold text-slate-700 dark:text-slate-300">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone"
                  className="h-11 rounded-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {existingPatient && !preselectedPatientId && (
            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-4 rounded-xl">
              <p className="text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">✨ Existing patient found: {existingPatient.id}</p>
            </div>
          )}

          {isNewPatient && (
            <div className="bg-blue-50/50 dark:bg-blue-500/5 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
              <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">New Patient Registration</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-xs font-bold text-slate-700 dark:text-slate-300">Age *</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="h-11 rounded-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-xs font-bold text-slate-700 dark:text-slate-300">Gender *</Label>
                  <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                    <SelectTrigger id="gender" className="w-full h-11 rounded-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="diagnosis" className="text-xs font-bold text-slate-700 dark:text-slate-300">Diagnosis *</Label>
                <Input
                  id="diagnosis"
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  placeholder="Primary diagnosis"
                  className="h-11 rounded-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>
          )}

          <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Appointment Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="doctor" className="text-xs font-bold text-slate-700 dark:text-slate-300">Doctor *</Label>
                <Select value={formData.doctor} onValueChange={handleDoctorChange} disabled={currentUser?.role === "DOCTOR"}>
                  <SelectTrigger id="doctor" className="w-full h-11 rounded-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {filteredDoctors.map(d => (
                      <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                    ))}
                    {filteredDoctors.length === 0 && (
                      <SelectItem value="no-doctors" disabled>No doctors found</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="visitType" className="text-xs font-bold text-slate-700 dark:text-slate-300">Visit Type *</Label>
                <Select value={formData.visitType} onValueChange={(v) => setFormData({ ...formData, visitType: v })}>
                  <SelectTrigger id="visitType" className="w-full h-11 rounded-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Initial Consultation">Initial Consultation</SelectItem>
                    <SelectItem value="Follow-up">Follow-up</SelectItem>
                    <SelectItem value="Post-Surgery">Post-Surgery</SelectItem>
                    <SelectItem value="Check-up">Check-up</SelectItem>
                    <SelectItem value="Physical Therapy">Physical Therapy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-xs font-bold text-slate-700 dark:text-slate-300">Date *</Label>
                <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="h-11 rounded-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time" className="text-xs font-bold text-slate-700 dark:text-slate-300">Time *</Label>
                <Input id="time" type="time" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} className="h-11 rounded-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-xs font-bold text-slate-700 dark:text-slate-300">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any special instructions..."
                rows={2}
                className="rounded-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-3 justify-end px-8 pb-8 pt-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 rounded-b-3xl">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading} className="rounded-xl h-11 px-6 font-bold">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="rounded-xl h-11 px-6 font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Confirm Appointment"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
