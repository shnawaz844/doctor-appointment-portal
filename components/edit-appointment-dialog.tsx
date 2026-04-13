import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

export function EditAppointmentDialog({
    children,
    appointment,
    onSuccess
}: {
    children: React.ReactNode,
    appointment: any,
    onSuccess?: () => void
}) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [patients, setPatients] = useState<any[]>([])
    const [doctors, setDoctors] = useState<any[]>([])
    const [specialties, setSpecialties] = useState<any[]>([])
    const [mounted, setMounted] = useState(false)

    const [formData, setFormData] = useState({
        patient_id: appointment.patient_id,
        date: appointment.date,
        time: appointment.time,
        doctor: appointment.doctor,
        specialty: appointment.specialty || "",
        visitType: appointment.type,
        status: appointment.status,
        notes: appointment.notes || "",
    })

    useEffect(() => {
        setMounted(true)
        if (open) {
            async function fetchData() {
                try {
                    const [patientsRes, doctorsRes, specialtiesRes] = await Promise.all([
                        fetch("/api/patients"),
                        fetch("/api/doctors"),
                        fetch("/api/specialties")
                    ])
                    const [patientsData, doctorsData, specialtiesData] = await Promise.all([
                        patientsRes.json(),
                        doctorsRes.json(),
                        specialtiesRes.json()
                    ])
                    setPatients(Array.isArray(patientsData) ? patientsData : [])
                    setDoctors(Array.isArray(doctorsData) ? doctorsData : [])
                    setSpecialties(Array.isArray(specialtiesData) ? specialtiesData : [])
                } catch (error) {
                    console.error("Failed to fetch data:", error)
                }
            }
            fetchData()

            // Update form data if appointment prop changes while open
            setFormData({
                patient_id: appointment.patient_id,
                date: appointment.date,
                time: appointment.time,
                doctor: appointment.doctor,
                specialty: appointment.specialty || "",
                visitType: appointment.type,
                status: appointment.status,
                notes: appointment.notes || "",
            })
        }
    }, [open, appointment])

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

    const handleSubmit = async () => {
        if (!formData.patient_id || !formData.date || !formData.time || !formData.doctor || !formData.visitType || !formData.status || !formData.specialty) {
            alert("Please fill in all required fields")
            return
        }

        setLoading(true)
        try {
            const selectedPatient = patients.find(p => p.id === formData.patient_id) || { name: appointment.patientName, phone: appointment.phone }

            const payload = {
                id: appointment.id || appointment._id,
                _id: appointment._id,
                patient_name: selectedPatient.name,
                patient_id: formData.patient_id,
                date: formData.date,
                time: formData.time,
                doctor: formData.doctor,
                specialty: formData.specialty,
                type: formData.visitType,
                status: formData.status,
                phone: selectedPatient.phone,
                notes: formData.notes
            }

            const response = await fetch("/api/appointments", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            if (response.ok) {
                setOpen(false)
                if (onSuccess) onSuccess()
            } else {
                const errorData = await response.json()
                alert(errorData.error || "Failed to update appointment")
            }
        } catch (error) {
            console.error("Error updating appointment:", error)
            alert("An error occurred")
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
                    <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white">Edit Appointment <span className="text-sm font-bold text-slate-400 ml-2 uppercase tracking-widest">{appointment.id}</span></DialogTitle>
                </DialogHeader>
                <div className="space-y-6 p-8">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Patient Details</h4>
                        <div className="space-y-2">
                            <Label htmlFor="patient_id" className="text-xs font-bold text-slate-700 dark:text-slate-300">Patient ID *</Label>
                            <Select value={formData.patient_id} onValueChange={(v) => setFormData({ ...formData, patient_id: v })}>
                                <SelectTrigger id="patient_id" className="w-full h-11 rounded-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                                    <SelectValue placeholder="Select patient" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {patients.length > 0 ? (
                                        patients.map(p => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.id} - {p.name}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem value={appointment.patient_id}>{appointment.patient_id} - {appointment.patientName}</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Appointment Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="doctor" className="text-xs font-bold text-slate-700 dark:text-slate-300">Doctor *</Label>
                                <Select value={formData.doctor} onValueChange={handleDoctorChange}>
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
                            <Label htmlFor="status" className="text-xs font-bold text-slate-700 dark:text-slate-300">Status *</Label>
                            <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                                <SelectTrigger id="status" className="w-full h-11 rounded-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                                    <SelectItem value="Confirmed">Confirmed</SelectItem>
                                    <SelectItem value="Completed">Completed</SelectItem>
                                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes" className="text-xs font-bold text-slate-700 dark:text-slate-300">Notes</Label>
                            <Textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Any special instructions or notes..."
                                rows={3}
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
                                Updating...
                            </>
                        ) : (
                            "Update Appointment"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
