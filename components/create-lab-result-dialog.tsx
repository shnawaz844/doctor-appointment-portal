"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Beaker, 
  Stethoscope, 
  User, 
  ClipboardList, 
  Activity, 
  AlertCircle, 
  FlaskConical, 
  TestTube2,
  Calendar,
  ChevronRight,
  Info
} from "lucide-react"

interface CreateLabResultDialogProps {
  children: React.ReactNode
  onCreated?: () => void
}

export function CreateLabResultDialog({ children, onCreated }: CreateLabResultDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [patientName, setPatientName] = useState("")
  const [patientId, setPatientId] = useState("")
  const [doctorName, setDoctorName] = useState("")
  const [testName, setTestName] = useState("")
  const [testType, setTestType] = useState("")
  const [status, setStatus] = useState("Pending")
  const [result, setResult] = useState("Awaiting")
  const [notes, setNotes] = useState("")
  const [patients, setPatients] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])

  useEffect(() => {
    if (open) {
      Promise.all([
        fetch("/api/patients").then((res) => res.json()),
        fetch("/api/doctors").then((res) => res.json())
      ])
        .then(([patientsData, doctorsData]) => {
          if (Array.isArray(patientsData)) setPatients(patientsData)
          if (Array.isArray(doctorsData)) setDoctors(doctorsData)
        })
        .catch(console.error)
    }
  }, [open])

  const handleSubmit = async () => {
    if (!patientName || !patientId || !testName || !doctorName) return
    setLoading(true)
    try {
      const res = await fetch("/api/lab-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName,
          patientId,
          doctor: doctorName,
          testName,
          testType,
          status,
          result,
          interpretation: notes,
          date: new Date().toISOString().split("T")[0],
        }),
      })
      if (res.ok) {
        setOpen(false)
        setPatientName("")
        setPatientId("")
        setDoctorName("")
        setTestName("")
        setTestType("")
        setStatus("Pending")
        setResult("Awaiting")
        setNotes("")
        onCreated?.()
      }
    } catch (error) {
      console.error("Failed to create lab result:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl h-[90vh] bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border-slate-200/50 dark:border-white/10 shadow-[0_32px_64px_-15px_rgba(0,0,0,0.2)] rounded-[2.5rem] p-0 overflow-hidden border">
        <DialogHeader className="px-8 pt-8 pb-6 bg-linear-to-r from-blue-600/10 via-transparent to-purple-600/10 border-b border-slate-100 dark:border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl -mr-16 -mt-16 rounded-full" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 blur-3xl -ml-12 -mb-12 rounded-full" />
          <div className="flex items-center gap-4 relative">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20 text-white">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Create Lab Result</DialogTitle>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">Enter diagnostic findings and test details</p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col h-[calc(90vh-160px)]">
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="space-y-8"
            >
              {/* Patient & Doctor */}
              <div className="group bg-white/50 dark:bg-slate-900/40 p-6 rounded-4xl border border-slate-200/60 dark:border-white/5 hover:border-blue-500/30 transition-all duration-300 shadow-sm hover:shadow-md">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                    <User className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200 uppercase tracking-widest">Patient & Doctor</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2.5">
                    <Label htmlFor="patientName" className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      SELECT PATIENT <span className="text-rose-500">*</span>
                    </Label>
                    <Select
                      value={patientName}
                      onValueChange={(val) => {
                        const patient = patients.find((p) => p.name === val)
                        if (patient) {
                          setPatientName(patient.name)
                          setPatientId(patient.id || patient._id || "")
                          setDoctorName(patient.doctor || "")
                        }
                      }}
                    >
                      <SelectTrigger id="patientName" className="w-full h-12 rounded-2xl bg-white/50 dark:bg-slate-950/50 border-slate-200/60 dark:border-white/5 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all">
                        <SelectValue placeholder="Select patient" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-200/60 dark:border-white/10 backdrop-blur-xl">
                        {patients.map((p) => (
                          <SelectItem key={p.id || p._id} value={p.name} className="rounded-xl focus:bg-blue-50 dark:focus:bg-blue-900/20">
                            <div className="flex flex-col py-0.5">
                              <span className="font-semibold">{p.name}</span>
                              <span className="text-[10px] text-slate-400">OPD: {p.id || p._id}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2.5">
                    <Label htmlFor="doctorName" className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      ATTENDING DOCTOR <span className="text-rose-500">*</span>
                    </Label>
                    <Select value={doctorName} onValueChange={setDoctorName}>
                      <SelectTrigger id="doctorName" className="w-full h-12 rounded-2xl bg-white/50 dark:bg-slate-950/50 border-slate-200/60 dark:border-white/5 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all">
                        <SelectValue placeholder="Select doctor" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-200/60 dark:border-white/10 backdrop-blur-xl">
                        {doctors.map((d) => (
                          <SelectItem key={d.id || d._id} value={d.name} className="rounded-xl focus:bg-blue-50 dark:focus:bg-blue-900/20">
                            <div className="flex items-center gap-2">
                              <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-semibold">{d.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Test Information */}
              <div className="group bg-white/50 dark:bg-slate-900/40 p-6 rounded-4xl border border-slate-200/60 dark:border-white/5 hover:border-purple-500/30 transition-all duration-300 shadow-sm hover:shadow-md">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                    <TestTube2 className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200 uppercase tracking-widest">Test Information</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2.5">
                    <Label htmlFor="testName" className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      TEST NAME <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="testName"
                        value={testName}
                        onChange={(e) => setTestName(e.target.value)}
                        placeholder="e.g., CBC"
                        className="h-12 rounded-2xl bg-white/50 dark:bg-slate-950/50 border-slate-200/60 dark:border-white/5 pl-10 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                      />
                      <Beaker className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                  
                  <div className="space-y-2.5">
                    <Label htmlFor="testType" className="text-xs font-bold text-slate-500 dark:text-slate-400">TEST TYPE</Label>
                    <Select value={testType} onValueChange={setTestType}>
                      <SelectTrigger id="testType" className="w-full h-12 rounded-2xl bg-white/50 dark:bg-slate-950/50 border-slate-200/60 dark:border-white/5">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-200/60 dark:border-white/10 backdrop-blur-xl">
                        {["Blood Test", "Urine Test", "X-Ray", "Ultrasound", "ECG", "CT Scan", "MRI"].map(val => (
                          <SelectItem key={val} value={val} className="rounded-xl focus:bg-blue-50 dark:focus:bg-blue-900/20">{val}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Status & Results */}
              <div className="group bg-white/50 dark:bg-slate-900/40 p-6 rounded-4xl border border-slate-200/60 dark:border-white/5 hover:border-emerald-500/30 transition-all duration-300 shadow-sm hover:shadow-md">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                    <Activity className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200 uppercase tracking-widest">Status & Results</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2.5">
                    <Label htmlFor="status" className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      STATUS
                    </Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger id="status" className="w-full h-12 rounded-2xl bg-white/50 dark:bg-slate-950/50 border-slate-200/60 dark:border-white/5">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            status === 'Pending' ? 'bg-amber-500 animate-pulse' : 
                            status === 'Complete' ? 'bg-emerald-500' : 'bg-blue-500'
                          }`} />
                          <SelectValue placeholder="Status" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl backdrop-blur-xl">
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Processing">Processing</SelectItem>
                        <SelectItem value="Complete">Complete</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2.5">
                    <Label htmlFor="result" className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      RESULT
                    </Label>
                    <Select value={result} onValueChange={setResult}>
                      <SelectTrigger id="result" className="w-full h-12 rounded-2xl bg-white/50 dark:bg-slate-950/50 border-slate-200/60 dark:border-white/5">
                        <SelectValue placeholder="Result" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl backdrop-blur-xl">
                        <SelectItem value="Awaiting">Awaiting</SelectItem>
                        <SelectItem value="Normal" className="text-emerald-600 dark:text-emerald-400 font-bold">Normal</SelectItem>
                        <SelectItem value="Borderline" className="text-amber-600 dark:text-amber-400 font-bold">Borderline</SelectItem>
                        <SelectItem value="Abnormal" className="text-rose-600 dark:text-rose-400 font-bold">Abnormal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2.5 mt-8">
                  <Label htmlFor="notes" className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <ClipboardList className="w-3 h-3" /> NOTES / INTERPRETATION
                  </Label>
                  <div className="relative">
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Summarize key findings..."
                      className="rounded-3xl bg-white/50 dark:bg-slate-950/50 border-slate-200/60 dark:border-white/5 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all min-h-[160px] resize-none p-4"
                    />
                    <div className="absolute top-3 right-3 p-1.5 bg-slate-100 dark:bg-white/5 rounded-xl opacity-30">
                      <Info className="w-3 h-3 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="flex gap-4 justify-end px-8 py-5 bg-white/50 dark:bg-slate-900/60 backdrop-blur-xl border-t border-slate-100 dark:border-white/5 items-center">
            <Button 
              variant="ghost" 
              onClick={() => setOpen(false)} 
              className="rounded-2xl h-12 px-6 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !patientName || !patientId || !testName || !doctorName} 
              className="rounded-2xl h-12 px-8 font-extrabold bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-[0_10px_20px_-10px_rgba(37,99,235,0.4)] hover:shadow-[0_15px_30px_-10px_rgba(37,99,235,0.5)] transition-all duration-300 min-w-[180px] flex items-center gap-2"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                <>
                  <span>Create Lab Result</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog >
  )
}
