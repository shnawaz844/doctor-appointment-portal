"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, User, Calendar, Smartphone, Mail, Stethoscope, FileText, ChevronRight, ChevronLeft, Activity, Info, AlertCircle, Upload } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { formatPhoneWithPrefix } from "@/lib/phone"

export function AddPatientDialog({ children, onSuccess }: { children: React.ReactNode, onSuccess?: () => void }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [doctors, setDoctors] = useState<any[]>([])
  const [specialties, setSpecialties] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    phone: "",
    email: "",
    diagnosis: "",
    doctor: "",
    laterality: "",
    severity: "",
    reportType: "X-Ray",
    otherReportType: "",
    reportFile: null as File | null,
  })

  useEffect(() => {
    async function fetchData() {
      setDataLoading(true)
      try {
        const [docRes, specRes, meRes] = await Promise.all([
          fetch("/api/doctors"),
          fetch("/api/specialties"),
          fetch("/api/auth/me")
        ])

        if (docRes.ok) setDoctors(await docRes.json())
        if (specRes.ok) setSpecialties(await specRes.json())
        if (meRes.ok) {
          const meData = await meRes.json()
          setCurrentUser(meData.user)

          // If the logged in user is a doctor, auto-set them
          if (meData.user?.role === "DOCTOR") {
            setFormData(prev => ({ ...prev, doctor: meData.user.name }))
          }
        }
      } catch (error) {
        console.error("Error fetching dialog data:", error)
      } finally {
        setDataLoading(false)
      }
    }

    if (open) {
      fetchData()
    }
  }, [open])

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateStep = (currentStep: number) => {
    const newErrors: Record<string, string> = {}
    if (currentStep === 1) {
      if (!formData.name) newErrors.name = "Full name is required"
      if (!formData.age) newErrors.age = "Age is required"
      if (!formData.gender) newErrors.gender = "Gender is required"
      if (!formData.phone) newErrors.phone = "Phone is required"
    } else if (currentStep === 2) {
      if (!formData.diagnosis) newErrors.diagnosis = "Diagnosis is required"
      if (!formData.doctor) newErrors.doctor = "Doctor is required"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      if (step < 3) setStep(step + 1)
    }
  }

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1)
    setErrors({})
  }

  const handleSubmit = async () => {
    if (!validateStep(3)) {
      if (!validateStep(1) || !validateStep(2)) {
        alert("Please complete all required fields in Previous steps.")
        return
      }
    }

    setLoading(true)
    try {
      const now = new Date()
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

      let reportUrl = ""
      if (formData.reportFile) {
        const uploadData = new FormData()
        uploadData.append("file", formData.reportFile)
        uploadData.append("bucket", "uploads")
        const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadData })
        if (uploadRes.ok) {
          const uploadJson = await uploadRes.json()
          reportUrl = uploadJson.url
        } else {
          alert("Failed to upload report file. Proceeding without file.")
        }
      }

      const payload = {
        id: `P${Math.floor(1000 + Math.random() * 9000).toString()}`,
        name: formData.name,
        age: Number(formData.age),
        gender: formData.gender,
        phone: formatPhoneWithPrefix(formData.phone),
        diagnosis: formData.diagnosis,
        doctor: formData.doctor,
        lastVisit: now.toISOString().split('T')[0],
        reportType: formData.reportType === "Others" ? formData.otherReportType : formData.reportType,
        year: now.getFullYear().toString(),
        month: months[now.getMonth()],
        laterality: formData.laterality || "Right",
        severity: formData.severity || "Mild",
        injuryDate: now.toISOString().split('T')[0],
        surgeryRequired: false,
        physicalTherapy: false,
        reportUrl: reportUrl,
      }

      const response = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setOpen(false)
        setStep(1)
        setFormData({
          name: "",
          age: "",
          gender: "",
          phone: "",
          email: "",
          diagnosis: "",
          doctor: currentUser?.role === "DOCTOR" ? currentUser.name : "",
          laterality: "",
          severity: "",
          reportType: "X-Ray",
          otherReportType: "",
          reportFile: null,
        })
        setErrors({})
        if (onSuccess) onSuccess()
      } else {
        const error = await response.json()
        alert(`Failed to add patient: ${error.error || JSON.stringify(error)}`)
      }
    } catch (error) {
      console.error("Error adding patient:", error)
      alert("An error occurred while adding the patient")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl h-[90vh] bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border-slate-200/50 dark:border-white/10 shadow-[0_32px_64px_-15px_rgba(0,0,0,0.2)] rounded-[2.5rem] p-0 overflow-hidden border">
        <DialogHeader className="px-8 pt-8 pb-6 bg-linear-to-r from-emerald-600/10 via-transparent to-blue-600/10 border-b border-slate-100 dark:border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl -mr-16 -mt-16 rounded-full" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 blur-3xl -ml-12 -mb-12 rounded-full" />
          <div className="flex items-center justify-between relative">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#e05d38] rounded-2xl shadow-lg shadow-emerald-500/20 text-white">
                <User className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Add Patient</DialogTitle>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">Register a new patient to the system</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-white/50 dark:bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-200/50 dark:border-white/5">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    s === step ? "w-6 bg-[#e05d38]" : s < step ? "bg-[#e05d38]" : "bg-slate-300 dark:bg-slate-700"
                  )}
                />
              ))}
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Step {step}/3</span>
            </div>
          </div>
        </DialogHeader>

        {dataLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-emerald-100 dark:border-emerald-900/30 rounded-full animate-pulse" />
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600 absolute top-4 left-4" />
            </div>
            <p className="font-bold text-slate-400 animate-pulse uppercase tracking-[0.2em] text-[10px]">Synchronizing Resources...</p>
          </div>
        ) : (
          <div className="flex flex-col h-[calc(90vh-160px)]">
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {step === 1 && (
                    <div className="group bg-white/50 dark:bg-slate-900/40 p-6 rounded-4xl border border-slate-200/60 dark:border-white/5 hover:border-emerald-500/30 transition-all duration-300 shadow-sm hover:shadow-md">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-[#e05d38] dark:text-[#e05d38] group-hover:scale-110 transition-transform">
                          <User className="w-4 h-4" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200 uppercase tracking-widest">Personal Information</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2.5">
                          <Label htmlFor="name" className={cn("text-xs font-bold flex items-center gap-2", errors.name ? "text-rose-500" : "text-slate-500 dark:text-slate-400")}>
                            FULL NAME <span className="text-rose-500">*</span>
                          </Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., John Doe"
                            className={cn("h-12 rounded-2xl bg-white/50 dark:bg-slate-950/50 border-slate-200/60 dark:border-white/5 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all", errors.name && "border-rose-500/50 bg-rose-50/10")}
                          />
                          {errors.name && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tight flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.name}</p>}
                        </div>

                        <div className="space-y-2.5">
                          <Label htmlFor="age" className={cn("text-xs font-bold flex items-center gap-2", errors.age ? "text-rose-500" : "text-slate-500 dark:text-slate-400")}>
                            AGE <span className="text-rose-500">*</span>
                          </Label>
                          <div className="relative">
                            <Input
                              id="age"
                              type="number"
                              value={formData.age}
                              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                              placeholder="32"
                              className={cn("h-12 rounded-2xl bg-white/50 dark:bg-slate-950/50 border-slate-200/60 dark:border-white/5 pl-10", errors.age && "border-rose-500/50 bg-rose-50/10")}
                            />
                            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          </div>
                          {errors.age && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tight flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.age}</p>}
                        </div>

                        <div className="space-y-2.5">
                          <Label htmlFor="gender" className={cn("text-xs font-bold flex items-center gap-2", errors.gender ? "text-rose-500" : "text-slate-500 dark:text-slate-400")}>
                            GENDER <span className="text-rose-500">*</span>
                          </Label>
                          <Select value={formData.gender || undefined} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                            <SelectTrigger id="gender" className={cn("h-12 rounded-2xl bg-white/50 dark:bg-slate-950/50 border-slate-200/60 dark:border-white/5 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all", errors.gender && "border-rose-500/50 bg-rose-50/10")}>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-slate-200/60 dark:border-white/10 backdrop-blur-xl">
                              <SelectItem value="Male" className="rounded-xl">Male</SelectItem>
                              <SelectItem value="Female" className="rounded-xl">Female</SelectItem>
                              <SelectItem value="Others" className="rounded-xl">Others</SelectItem>
                            </SelectContent>
                          </Select>
                          {errors.gender && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tight flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.gender}</p>}
                        </div>

                        <div className="space-y-2.5">
                          <Label htmlFor="phone" className={cn("text-xs font-bold flex items-center gap-2", errors.phone ? "text-rose-500" : "text-slate-500 dark:text-slate-400")}>
                            PHONE <span className="text-rose-500">*</span>
                          </Label>
                          <div className="relative">
                            <Input
                              id="phone"
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              placeholder="+91-0000000000"
                              className={cn("h-12 rounded-2xl bg-white/50 dark:bg-slate-950/50 border-slate-200/60 dark:border-white/5 pl-10", errors.phone && "border-rose-500/50 bg-rose-50/10")}
                            />
                            <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          </div>
                        </div>

                        <div className="md:col-span-2 space-y-2.5">
                          <Label htmlFor="email" className="text-xs font-bold text-slate-500 dark:text-slate-400">EMAIL ADDRESS</Label>
                          <div className="relative">
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              placeholder="example@email.com"
                              className="h-12 rounded-2xl bg-white/50 dark:bg-slate-950/50 border-slate-200/60 dark:border-white/5 pl-10 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
                            />
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="group bg-white/50 dark:bg-slate-900/40 p-6 rounded-4xl border border-slate-200/60 dark:border-white/5 hover:border-emerald-500/30 transition-all duration-300 shadow-sm hover:shadow-md">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                          <Stethoscope className="w-4 h-4" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200 uppercase tracking-widest">Medical Information</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2.5">
                          <Label htmlFor="diagnosis" className={cn("text-xs font-bold flex items-center gap-2", errors.diagnosis ? "text-rose-500" : "text-slate-500 dark:text-slate-400")}>
                            DIAGNOSIS / SPECIALTY <span className="text-rose-500">*</span>
                          </Label>
                          <Select value={formData.diagnosis || undefined} onValueChange={(v) => setFormData({ ...formData, diagnosis: v })}>
                            <SelectTrigger id="diagnosis" className={cn("h-12 rounded-2xl bg-white/50 dark:bg-slate-950/50 border-slate-200/60 dark:border-white/5 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all", errors.diagnosis && "border-rose-500/50 bg-rose-50/10")}>
                              <SelectValue placeholder="Select diagnosis" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-slate-200/60 dark:border-white/10 backdrop-blur-xl">
                              {specialties.length > 0 ? (
                                specialties.map((s) => (
                                  <SelectItem key={s.id || s._id} value={s.name} className="rounded-xl focus:bg-emerald-50 dark:focus:bg-emerald-900/20">{s.name}</SelectItem>
                                ))
                              ) : (
                                ["Knee Osteoarthritis", "Lumbar Disc Herniation", "Rotator Cuff Tear", "Cervical Spondylosis"].map(d => (
                                  <SelectItem key={d} value={d} className="rounded-xl">{d}</SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          {errors.diagnosis && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tight flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.diagnosis}</p>}
                        </div>

                        <div className="space-y-2.5">
                          <Label htmlFor="doctor" className={cn("text-xs font-bold flex items-center gap-2", errors.doctor ? "text-rose-500" : "text-slate-500 dark:text-slate-400")}>
                            ATTENDING DOCTOR <span className="text-rose-500">*</span>
                          </Label>
                          <Select
                            value={formData.doctor || undefined}
                            onValueChange={(v) => setFormData({ ...formData, doctor: v })}
                            disabled={currentUser?.role === "DOCTOR"}
                          >
                            <SelectTrigger id="doctor" className={cn("h-12 rounded-2xl bg-white/50 dark:bg-slate-950/50 border-slate-200/60 dark:border-white/5 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all", errors.doctor && "border-rose-500/50 bg-rose-50/10")}>
                              <SelectValue placeholder="Select doctor" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl backdrop-blur-xl">
                              {doctors
                                .filter(d => {
                                  if (!formData.diagnosis) return true;
                                  const docSpec = specialties.find(s => s.id === d.specialty_id || s._id === d.specialty_id);
                                  return docSpec?.name?.toLowerCase() === formData.diagnosis.toLowerCase();
                                })
                                .map((d) => (
                                <SelectItem key={d.id || d._id} value={d.name} className="rounded-xl">
                                  <div className="flex items-center gap-2">
                                    <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{d.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.doctor && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tight flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.doctor}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="group bg-white/50 dark:bg-slate-900/40 p-6 rounded-4xl border border-slate-200/60 dark:border-white/5 hover:border-emerald-500/30 transition-all duration-300 shadow-sm hover:shadow-md">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                          <FileText className="w-4 h-4" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200 uppercase tracking-widest">Initial Reports (Optional)</h4>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-2.5">
                          <Label htmlFor="reportType" className="text-xs font-bold text-slate-500 dark:text-slate-400">REPORT TYPE</Label>
                          <Select value={formData.reportType || undefined} onValueChange={(v) => setFormData({ ...formData, reportType: v })}>
                            <SelectTrigger id="reportType" className="h-12 rounded-2xl bg-white/50 dark:bg-slate-950/50 border-slate-200/60 dark:border-white/5">
                              <SelectValue placeholder="Select report type" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl backdrop-blur-xl">
                              {["X-Ray", "MRI", "CT-Scan", "Ultrasound", "Others", "Physical Therapy", "Echocardiogram", "EEG", "EMG", "Nerve Conduction Study", "Bone Density Scan", "Mammography"].map(r => (
                                <SelectItem key={r} value={r} className="rounded-xl">{r}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {formData.reportType === "Others" && (
                          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2.5">
                            <Label htmlFor="otherReportType" className="text-xs font-bold text-slate-500 dark:text-slate-400">SPECIFY TYPE <span className="text-rose-500">*</span></Label>
                            <Input
                              id="otherReportType"
                              value={formData.otherReportType}
                              onChange={(e) => setFormData({ ...formData, otherReportType: e.target.value })}
                              placeholder="e.g., Blood Test"
                              className="h-12 rounded-2xl bg-white/50 dark:bg-slate-950/50 border-slate-200/60 dark:border-white/5"
                            />
                          </motion.div>
                        )}

                        <div className="space-y-2.5">
                          <Label htmlFor="file" className="text-xs font-bold text-slate-500 dark:text-slate-400">UPLOAD REPORT</Label>
                          <div className="relative group/upload">
                            <Input
                              id="file"
                              type="file"
                              accept=".pdf,.jpg,.png,.dcm"
                              onChange={(e) => setFormData({ ...formData, reportFile: e.target.files?.[0] || null })}
                              className="h-12 rounded-2xl bg-white/50 dark:bg-slate-950/50 border-slate-200/60 dark:border-white/5 cursor-pointer file:cursor-pointer p-[0.4rem] file:h-full file:border-0 file:bg-emerald-100 file:dark:bg-emerald-900/30 file:text-emerald-700 file:dark:text-emerald-300 file:rounded-xl file:px-4 file:mr-3 transition-all"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 group-hover/upload:opacity-100 transition-opacity">
                              <Upload className="w-4 h-4 text-emerald-600" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex gap-4 justify-end px-8 py-5 bg-white/50 dark:bg-slate-900/60 backdrop-blur-xl border-t border-slate-100 dark:border-white/5 items-center">
              {step > 1 && (
                <Button
                  variant="ghost"
                  onClick={handlePrevious}
                  disabled={loading}
                  className="rounded-2xl h-12 px-6 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
              )}

              <div className="flex-1" />

              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                className="rounded-2xl h-12 px-6 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                disabled={loading}
              >
                Cancel
              </Button>

              {step < 3 ? (
                <Button
                  onClick={handleNext}
                  className="rounded-2xl h-12 px-8 font-extrabold bg-linear-to-r from-[#e05d38] to-[#e05d38] hover:from-[#e05d38] hover:to-[#e05d38] text-white shadow-[0_10px_20px_-10px_rgba(16,185,129,0.4)] hover:shadow-[0_15px_30px_-10px_rgba(16,185,129,0.5)] transition-all duration-300 flex items-center gap-2 min-w-[140px]"
                >
                  <span>Next Step</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="rounded-2xl h-12 px-8 font-extrabold bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-[0_10px_20px_-10px_rgba(79,70,229,0.4)] hover:shadow-[0_15px_30px_-10px_rgba(79,70,229,0.5)] transition-all duration-300 flex items-center gap-2 min-w-[180px]"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Registering...</span>
                    </div>
                  ) : (
                    <>
                      <span>Complete Registration</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
