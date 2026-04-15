"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check, ChevronsUpDown, Loader2, Scan, Activity, Calendar, Stethoscope, Image as ImageIcon, Upload, ChevronRight, AlertCircle, User } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface Patient {
    _id: string
    id: string
    name: string
    doctor?: string
}

interface Doctor {
    _id: string
    id: string
    name: string
    email?: string
    specialties?: {
        name: string
    }
}

interface CreateImagingDialogProps {
    children: React.ReactNode
    onCreated?: () => void
    preselectedPatientId?: string
    preselectedPatientName?: string
    preselectedDoctor?: string
}

const SPECIALTY_BODY_PARTS: Record<string, string[]> = {
    "Cardiology": ["Heart", "Eco Heart", "Chest", "Aorta", "Other"],
    "Orthopedics": ["Knee", "Lumbar Spine", "Cervical Spine", "Shoulder", "Ankle", "Hip", "Wrist", "Elbow", "Foot", "Thoracic Spine", "Other"],
    "Neurology": ["Brain", "Neck", "Cervical Spine", "Lumbar Spine", "Other"],
    "ENT": ["Ear", "Nose", "Throat", "Neck", "Sinus", "Other"],
    "Gynecology": ["Uterine", "Ovaries", "Pelvis", "Breast", "Fallopian", "Other"],
    "Gastroenterology": ["Abdomen", "Stomach", "Liver", "Intestines", "Pancreas", "Other"],
    "Pulmonology": ["Lungs", "Chest", "Bronchi", "Pleura", "Other"],
    "Urology": ["Kidneys", "Bladder", "Prostate", "Urinary Tract", "Other"],
    "General": ["Knee", "Lumbar Spine", "Cervical Spine", "Shoulder", "Ankle", "Hip", "Wrist", "Elbow", "Foot", "Thoracic Spine", "Heart", "Eco Heart", "Chest", "Brain", "Abdomen", "Pelvis", "Neck", "Other"]
}

const SPECIALTY_MODALITIES: Record<string, string[]> = {
    "Cardiology": ["ECG", "Echocardiogram", "Stress Test", "Holter Monitor", "CT", "MRI", "Ultrasound", "Other"],
    "Orthopedics": ["X-Ray", "CT", "MRI", "Ultrasound", "Other"],
    "Neurology": ["MRI", "CT", "EEG", "EMG", "Other"],
    "ENT": ["Endoscopy", "CT", "MRI", "X-Ray", "Ultrasound", "Other"],
    "Gynecology": ["Ultrasound", "MRI", "CT", "Mammography", "Other"],
    "Gastroenterology": ["Ultrasound", "CT", "MRI", "Endoscopy", "Colonoscopy", "Other"],
    "Pulmonology": ["Chest X-Ray", "CT", "MRI", "Spirometry", "Other"],
    "Urology": ["Ultrasound", "CT", "MRI", "Cystoscopy", "Other"],
    "General": ["X-Ray", "CT", "MRI", "Ultrasound", "ECG", "Echocardiogram", "EEG", "Other"]
}

const BODY_PART_MODALITIES: Record<string, string[]> = {
    // Cardiology
    "Heart": ["ECG", "Echocardiogram", "Stress Test", "Holter Monitor", "CT", "MRI", "Ultrasound", "Other"],
    "Eco Heart": ["ECG", "Echocardiogram", "Stress Test", "Holter Monitor", "CT", "MRI", "Ultrasound", "Other"],
    "Aorta": ["ECG", "Echocardiogram", "Stress Test", "CT", "MRI", "Ultrasound", "Other"],
    "Chest": ["X-Ray", "CT", "MRI", "Ultrasound", "Chest X-Ray", "ECG", "Echocardiogram", "Other"],
    // Orthopedics
    "Knee": ["X-Ray", "CT", "MRI", "Ultrasound", "Other"],
    "Lumbar Spine": ["X-Ray", "CT", "MRI", "Other"],
    "Cervical Spine": ["X-Ray", "CT", "MRI", "Other"],
    "Shoulder": ["X-Ray", "CT", "MRI", "Ultrasound", "Other"],
    "Ankle": ["X-Ray", "CT", "MRI", "Ultrasound", "Other"],
    "Hip": ["X-Ray", "CT", "MRI", "Ultrasound", "Other"],
    "Wrist": ["X-Ray", "CT", "MRI", "Ultrasound", "Other"],
    "Elbow": ["X-Ray", "CT", "MRI", "Ultrasound", "Other"],
    "Foot": ["X-Ray", "CT", "MRI", "Ultrasound", "Other"],
    "Thoracic Spine": ["X-Ray", "CT", "MRI", "Other"],
    // Neurology
    "Brain": ["MRI", "CT", "EEG", "Other"],
    "Neck": ["MRI", "CT", "Ultrasound", "X-Ray", "Other"],
    // ENT
    "Ear": ["Endoscopy", "CT", "MRI", "X-Ray", "Ultrasound", "Other"],
    "Nose": ["Endoscopy", "CT", "MRI", "X-Ray", "Ultrasound", "Other"],
    "Throat": ["Endoscopy", "CT", "MRI", "X-Ray", "Ultrasound", "Other"],
    "Sinus": ["Endoscopy", "CT", "MRI", "X-Ray", "Ultrasound", "Other"],
    // Gynecology
    "Uterine": ["Ultrasound", "MRI", "CT", "Other"],
    "Ovaries": ["Ultrasound", "MRI", "CT", "Other"],
    "Pelvis": ["Ultrasound", "MRI", "CT", "X-Ray", "Other"],
    "Breast": ["Mammography", "Ultrasound", "MRI", "CT", "Other"],
    "Fallopian": ["Ultrasound", "MRI", "CT", "Other"],
    // Gastroenterology
    "Abdomen": ["Ultrasound", "CT", "MRI", "Endoscopy", "Colonoscopy", "Other"],
    "Stomach": ["Ultrasound", "CT", "MRI", "Endoscopy", "Colonoscopy", "Other"],
    "Liver": ["Ultrasound", "CT", "MRI", "Other"],
    "Intestines": ["Ultrasound", "CT", "MRI", "Endoscopy", "Colonoscopy", "Other"],
    "Pancreas": ["Ultrasound", "CT", "MRI", "Other"],
    // Pulmonology
    "Lungs": ["Chest X-Ray", "CT", "MRI", "Spirometry", "Other"],
    "Bronchi": ["Chest X-Ray", "CT", "MRI", "Spirometry", "Other"],
    "Pleura": ["Chest X-Ray", "CT", "MRI", "Spirometry", "Other"],
    // Urology
    "Kidneys": ["Ultrasound", "CT", "MRI", "Other"],
    "Bladder": ["Ultrasound", "CT", "MRI", "Cystoscopy", "Other"],
    "Prostate": ["Ultrasound", "MRI", "CT", "Cystoscopy", "Other"],
    "Urinary Tract": ["Ultrasound", "CT", "MRI", "Cystoscopy", "Other"],
}

const MODALITY_DISPLAY_NAMES: Record<string, string> = {
    "CT": "CT Scan",
    "Echocardiogram": "Echocardiogram (Ultrasound)",
    "ECG": "ECG (Electrocardiogram)",
    "EEG": "EEG (Electroencephalogram)",
    "EMG": "EMG (Electromyogram)",
}

const MODALITY_DB_MAPPING: Record<string, string> = {
    "Echocardiogram": "Ultrasound",
    "ECG": "ECG",
    "EEG": "EEG",
    "EMG": "EMG",
    "Stress Test": "Stress Test",
    "Holter Monitor": "Holter Monitor",
}

const DEFAULT_BODY_PARTS = SPECIALTY_BODY_PARTS["General"]
const DEFAULT_MODALITIES = SPECIALTY_MODALITIES["General"]

const ALL_MODALITIES = Array.from(new Set(Object.values(SPECIALTY_MODALITIES).flat())).sort((a, b) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    return a.localeCompare(b);
})

const normalizeSpecialty = (name?: string): string => {
    if (!name) return "General"
    const lowerName = name.toLowerCase()
    if (lowerName.includes("cardio")) return "Cardiology"
    if (lowerName.includes("ortho")) return "Orthopedics"
    if (lowerName.includes("neuro")) return "Neurology"
    if (lowerName.includes("ent") || lowerName.includes("oto")) return "ENT"
    if (lowerName.includes("gyno") || lowerName.includes("obstet") || lowerName.includes("women")) return "Gynecology"
    if (lowerName.includes("gastro")) return "Gastroenterology"
    if (lowerName.includes("pulmo")) return "Pulmonology"
    if (lowerName.includes("uro")) return "Urology"
    
    // Exact match search in keys
    const foundKey = Object.keys(SPECIALTY_BODY_PARTS).find(k => 
        k.toLowerCase() === lowerName || lowerName.includes(k.toLowerCase())
    )
    return foundKey || "General"
}

export function CreateImagingDialog({
    children,
    onCreated,
    preselectedPatientId,
    preselectedPatientName,
    preselectedDoctor
}: CreateImagingDialogProps) {
    const [open, setOpen] = useState(false)
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [patientName, setPatientName] = useState(preselectedPatientName || "")
    const [patientId, setPatientId] = useState(preselectedPatientId || "")
    const [studyType, setStudyType] = useState("")
    const [bodyPart, setBodyPart] = useState("")
    const [modality, setModality] = useState("")
    const [date, setDate] = useState(new Date().toISOString().split("T")[0])
    const [aiFlag, setAiFlag] = useState("Normal")
    const [doctor, setDoctor] = useState(preselectedDoctor || "")
    const [thumbnails, setThumbnails] = useState<string[]>([])
    const [imageFiles, setImageFiles] = useState<File[]>([])

    const [patients, setPatients] = useState<Patient[]>([])
    const [doctors, setDoctors] = useState<Doctor[]>([])
    const [loadingData, setLoadingData] = useState(false)
    const [comboOpen, setComboOpen] = useState(false)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [currentSpecialty, setCurrentSpecialty] = useState<string>("General")

    useEffect(() => {
        if (open) {
            if (preselectedPatientName) setPatientName(preselectedPatientName)
            if (preselectedPatientId) setPatientId(preselectedPatientId)
            if (preselectedDoctor) setDoctor(preselectedDoctor)
        }
    }, [open, preselectedPatientName, preselectedPatientId, preselectedDoctor])

    useEffect(() => {
        if (!open) return
        const fetchData = async () => {
            setLoadingData(true)
            try {
                const [patientsRes, doctorsRes, meRes] = await Promise.all([
                    fetch("/api/patients"),
                    fetch("/api/doctors"),
                    fetch("/api/auth/me")
                ])

                let fetchedPatients: Patient[] = []
                let fetchedDoctors: Doctor[] = []

                if (patientsRes.ok) {
                    fetchedPatients = await patientsRes.json()
                    setPatients(fetchedPatients)
                }
                if (doctorsRes.ok) {
                    fetchedDoctors = await doctorsRes.json()
                    setDoctors(fetchedDoctors)
                }

                if (meRes.ok) {
                    const meData = await meRes.json()
                    const user = meData.user
                    setCurrentUser(user)

                    // Find specialty and doctor for current user
                    const doctorEmail = user.email?.toLowerCase().trim();
                    const doctorName = user.name?.toLowerCase().trim().replace(/^dr\.\s*/i, "");

                    let foundDoc = fetchedDoctors.find(d => {
                        const dEmail = d.email?.toLowerCase().trim();
                        const dName = d.name?.toLowerCase().trim().replace(/^dr\.\s*/i, "");
                        return (doctorEmail && dEmail === doctorEmail) || (doctorName && dName === doctorName);
                    });

                    if (user.role === "DOCTOR" && foundDoc) {
                        const specName = (foundDoc as any).specialties?.name
                        if (specName) {
                            setCurrentSpecialty(normalizeSpecialty(specName))
                        }
                        // Always prioritize current doctor if they are adding a study
                        setDoctor(foundDoc.name)
                    } else if (user.role === "DOCTOR") {
                         // Fallback to user name if doc not found in list but role is DOCTOR
                         setDoctor(user.name)
                    } else {
                        // If not a doctor, use patient's doctor or current selection if valid
                        const pId = preselectedPatientId || patientId
                        const currentPatient = fetchedPatients.find((p: any) => p.id === pId || p._id === pId)
                        const targetDoctorName = currentPatient?.doctor || doctor || preselectedDoctor || ""

                        // Ensure the selected doctor exists in the list
                        const validDoc = fetchedDoctors.find(d => {
                            const dName = d.name.toLowerCase().trim().replace(/^dr\.\s*/i, "");
                            const tName = targetDoctorName.toLowerCase().trim().replace(/^dr\.\s*/i, "");
                            return dName === tName;
                        })
                        if (validDoc) {
                            setDoctor(validDoc.name)
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to fetch data:", error)
            } finally {
                setLoadingData(false)
            }
        }
        fetchData()
    }, [open])

    const resetForm = () => {
        setPatientName(preselectedPatientName || "")
        setPatientId(preselectedPatientId || "")
        setStudyType("")
        setBodyPart("")
        setModality("")
        setDate(new Date().toISOString().split("T")[0])
        setAiFlag("Normal")
        setDoctor(preselectedDoctor || "")
        setThumbnails([])
        setImageFiles([])
    }

    const handleSubmit = async () => {
        if (!patientName || !patientId || !studyType || !bodyPart || !modality) return
        setLoading(true)
        try {
            let finalImageUrls: string[] = []
            if (imageFiles.length > 0) {
                for (const file of imageFiles) {
                    const formData = new FormData()
                    formData.append("file", file)
                    formData.append("bucket", "uploads")
                    formData.append("patientId", patientId || "anonymous")

                    const uploadRes = await fetch("/api/upload", {
                        method: "POST",
                        body: formData
                    })

                    if (uploadRes.ok) {
                        const uploadData = await uploadRes.json()
                        finalImageUrls.push(uploadData.url)
                    } else {
                        console.error("Failed to upload image")
                        alert("Failed to upload some images. Please try again.")
                        setLoading(false)
                        return
                    }
                }
            } else {
                finalImageUrls = ["/placeholder.svg"]
            }

            const res = await fetch("/api/imaging", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    patientName,
                    patientId,
                    studyType,
                    bodyPart,
                    modality: MODALITY_DB_MAPPING[modality] || modality,
                    date,
                    aiFlag,
                    doctor,
                    thumbnail: finalImageUrls.length > 1 ? JSON.stringify(finalImageUrls) : (finalImageUrls[0] || "/placeholder.svg"),
                }),
            })
            if (res.ok) {
                setOpen(false)
                resetForm()
                router.refresh()
                onCreated?.()
            } else {
                const errData = await res.json()
                alert(`Error: ${errData.details || "Failed to create imaging study"}`)
            }
        } catch (error: any) {
            console.error("Failed to create imaging study:", error)
            alert(`Failed to create: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length > 0) {
            setImageFiles(prev => [...prev, ...files])
            files.forEach(file => {
                const reader = new FileReader()
                reader.onloadend = () => {
                    setThumbnails(prev => [...prev, reader.result as string])
                }
                reader.readAsDataURL(file)
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-3xl h-[90vh] bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border-slate-200/50 dark:border-white/10 shadow-[0_32px_64px_-15px_rgba(0,0,0,0.2)] rounded-[2.5rem] p-0 overflow-hidden border">
                <DialogHeader className="px-8 pt-8 pb-6 bg-linear-to-r from-purple-600/10 via-transparent to-pink-600/10 border-b border-slate-100 dark:border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl -mr-16 -mt-16 rounded-full" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-500/10 blur-3xl -ml-12 -mb-12 rounded-full" />
                    <div className="flex items-center gap-4 relative">
                        <div className="p-3 bg-[#e05d38] rounded-2xl shadow-lg shadow-purple-500/20 text-white">
                            <Scan className="w-6 h-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">New Imaging Study</DialogTitle>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">Register a new radiology or imaging diagnostic</p>
                        </div>
                    </div>
                </DialogHeader>

                {loadingData ? (
                    <div className="flex flex-col items-center justify-center py-24 space-y-4">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-purple-100 dark:border-purple-900/30 rounded-full animate-pulse" />
                            <Loader2 className="h-8 w-8 animate-spin text-purple-600 absolute top-4 left-4" />
                        </div>
                        <p className="font-bold text-slate-400 animate-pulse uppercase tracking-[0.2em] text-[10px]">Synchronizing Imaging Data...</p>
                    </div>
                ) : (
                    <div className="flex flex-col h-[calc(90vh-160px)]">
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                                className="space-y-8"
                            >
                                {/* Patient Context */}
                                <div className="group bg-white/50 dark:bg-slate-900/40 p-6 rounded-4xl border border-slate-200/60 dark:border-white/5 hover:border-purple-500/30 transition-all duration-300 shadow-sm hover:shadow-md">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200 uppercase tracking-widest">Patient Details</h4>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2.5">
                                            <Label htmlFor="patientName" className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                                SELECT PATIENT <span className="text-rose-500">*</span>
                                            </Label>
                                            <Select
                                                value={patientName}
                                                onValueChange={(value) => {
                                                    setPatientName(value)
                                                    const patient = patients.find((p) => p.name === value)
                                                    if (patient) {
                                                        setPatientId(patient.id || patient._id)
                                                        if (patient.doctor) {
                                                            setDoctor(patient.doctor)
                                                        }
                                                    }
                                                }}
                                            >
                                                <SelectTrigger id="patientName" className="w-full h-12 rounded-2xl bg-white/50 dark:bg-slate-950/50 border-slate-200/60 dark:border-white/5 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all">
                                                    <SelectValue placeholder="Select patient" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-slate-200/60 dark:border-white/10 backdrop-blur-xl">
                                                    {patients.map((p) => (
                                                        <SelectItem key={p.id || p._id} value={p.name} className="rounded-xl">
                                                            {p.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2.5">
                                            <Label htmlFor="patientId" className="text-xs font-bold text-slate-500 dark:text-slate-400">PATIENT ID</Label>
                                            <Input
                                                id="patientId"
                                                value={patientId}
                                                readOnly
                                                className="h-12 rounded-2xl bg-slate-100/50 dark:bg-slate-800/50 border-transparent font-mono text-xs cursor-not-allowed"
                                                placeholder="Auto-populated"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Study Details */}
                                <div className="group bg-white/50 dark:bg-slate-900/40 p-6 rounded-4xl border border-slate-200/60 dark:border-white/5 hover:border-blue-500/30 transition-all duration-300 shadow-sm hover:shadow-md">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                            <Activity className="w-4 h-4" />
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200 uppercase tracking-widest">Study Information</h4>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-2.5">
                                            <Label htmlFor="studyType" className="text-xs font-bold text-slate-500 dark:text-slate-400">STUDY DESCRIPTION <span className="text-rose-500">*</span></Label>
                                            <Input
                                                id="studyType"
                                                value={studyType}
                                                onChange={(e) => setStudyType(e.target.value)}
                                                placeholder="e.g., Knee X-Ray (AP & Lateral)"
                                                className="h-12 rounded-2xl bg-white/50 dark:bg-slate-950/50 border-slate-200/60 dark:border-white/5"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2.5">
                                                <Label htmlFor="bodyPart" className="text-xs font-bold text-slate-500 dark:text-slate-400">BODY PART <span className="text-rose-500">*</span></Label>
                                                <Select value={bodyPart} onValueChange={setBodyPart}>
                                                    <SelectTrigger id="bodyPart" className="w-full h-12 rounded-2xl bg-white/50 dark:bg-slate-950/50 border-slate-200/60 dark:border-white/5">
                                                        <SelectValue placeholder="Select body part" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-2xl backdrop-blur-xl">
                                                        {(SPECIALTY_BODY_PARTS[currentSpecialty] || DEFAULT_BODY_PARTS).map((part) => (
                                                            <SelectItem key={part} value={part} className="rounded-xl">{part}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2.5">
                                                <Label htmlFor="modality" className="text-xs font-bold text-slate-500 dark:text-slate-400">MODALITY <span className="text-rose-500">*</span></Label>
                                                <Select value={modality} onValueChange={setModality}>
                                                    <SelectTrigger id="modality" className="w-full h-12 rounded-2xl bg-white/50 dark:bg-slate-950/50 border-slate-200/60 dark:border-white/5">
                                                        <SelectValue placeholder="Select modality" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-2xl backdrop-blur-xl">
                                                        {(bodyPart === "Other"
                                                            ? ALL_MODALITIES
                                                            : (bodyPart && BODY_PART_MODALITIES[bodyPart] 
                                                                ? BODY_PART_MODALITIES[bodyPart] 
                                                                : (SPECIALTY_MODALITIES[currentSpecialty] || DEFAULT_MODALITIES))
                                                        ).map((m) => (
                                                            <SelectItem key={m} value={m} className="rounded-xl">{MODALITY_DISPLAY_NAMES[m] || m}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2.5">
                                                <Label htmlFor="date" className="text-xs font-bold text-slate-500 dark:text-slate-400">STUDY DATE <span className="text-rose-500">*</span></Label>
                                                <div className="relative">
                                                    <Input
                                                        id="date"
                                                        type="date"
                                                        value={date}
                                                        onChange={(e) => setDate(e.target.value)}
                                                        className="h-12 rounded-2xl bg-white/50 dark:bg-slate-950/50 border-slate-200/60 dark:border-white/5 pl-10"
                                                    />
                                                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                </div>
                                            </div>
                                            <div className="space-y-2.5">
                                                <Label htmlFor="doctor" className="text-xs font-bold text-slate-500 dark:text-slate-400">ASSIGN DOCTOR <span className="text-rose-500">*</span></Label>
                                                <Select value={doctor} onValueChange={setDoctor} disabled={currentUser?.role === "DOCTOR"}>
                                                    <SelectTrigger id="doctor" className="w-full h-12 rounded-2xl bg-white/50 dark:bg-slate-950/50 border-slate-200/60 dark:border-white/5">
                                                        <SelectValue placeholder="Select doctor" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-2xl backdrop-blur-xl">
                                                        {doctors.map((doc) => (
                                                            <SelectItem key={doc._id} value={doc.name} className="rounded-xl">
                                                                <div className="flex items-center gap-2">
                                                                    <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                                                                    <span>{doc.name}</span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Additional & Upload */}
                                <div className="group bg-white/50 dark:bg-slate-900/40 p-6 rounded-4xl border border-slate-200/60 dark:border-white/5 hover:border-pink-500/30 transition-all duration-300 shadow-sm hover:shadow-md">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-xl text-pink-600 dark:text-pink-400 group-hover:scale-110 transition-transform">
                                            <ImageIcon className="w-4 h-4" />
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200 uppercase tracking-widest">Additional Details</h4>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-2.5">
                                            <Label htmlFor="aiFlag" className="text-xs font-bold text-slate-500 dark:text-slate-400">ANALYSIS RESULT</Label>
                                            <Select value={aiFlag} onValueChange={setAiFlag}>
                                                <SelectTrigger id="aiFlag" className="w-full h-12 rounded-2xl bg-white/50 dark:bg-slate-950/50 border-slate-200/60 dark:border-white/5">
                                                    <SelectValue placeholder="Select result" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl backdrop-blur-xl">
                                                    <SelectItem value="Normal" className="rounded-xl text-emerald-600 font-bold">Normal</SelectItem>
                                                    <SelectItem value="Abnormal" className="rounded-xl text-rose-600 font-bold">Abnormal</SelectItem>
                                                    <SelectItem value="Requires Review" className="rounded-xl text-amber-600 font-bold">Requires Review</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2.5">
                                            <Label htmlFor="imageUpload" className="text-xs font-bold text-slate-500 dark:text-slate-400">UPLOAD STUDY IMAGE (OPTIONAL)</Label>
                                            <div className="relative group/upload">
                                                <Input
                                                    id="imageUpload"
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    onChange={handleImageChange}
                                                    className="h-12 rounded-2xl bg-white/50 dark:bg-slate-950/50 border-slate-200/60 dark:border-white/5 cursor-pointer file:cursor-pointer p-[0.4rem] file:h-full file:border-0 file:bg-pink-100 file:dark:bg-pink-900/30 file:text-pink-700 file:dark:text-pink-300 file:rounded-xl file:px-4 file:mr-3 transition-all"
                                                />
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 group-hover/upload:opacity-100 transition-opacity">
                                                    <Upload className="w-4 h-4 text-pink-600" />
                                                </div>
                                            </div>

                                            <AnimatePresence>
                                                {thumbnails.length > 0 && (
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                                                        {thumbnails.map((src, idx) => (
                                                            <motion.div
                                                                key={`${idx}-${src.substring(0, 20)}`}
                                                                initial={{ opacity: 0, scale: 0.9 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                exit={{ opacity: 0, scale: 0.9 }}
                                                                className="rounded-3xl overflow-hidden border-2 border-dashed border-pink-200 dark:border-pink-900/30 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center p-2 h-32 relative group/preview"
                                                            >
                                                                <img src={src} alt={`Preview ${idx + 1}`} className="max-h-full object-contain rounded-xl shadow-lg" />
                                                                <Button
                                                                    variant="destructive"
                                                                    size="icon"
                                                                    className="absolute top-1 right-1 rounded-full w-6 h-6 opacity-0 group-hover/preview:opacity-100 transition-opacity"
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setThumbnails(prev => prev.filter((_, i) => i !== idx))
                                                                        setImageFiles(prev => prev.filter((_, i) => i !== idx))
                                                                    }}
                                                                >
                                                                    ×
                                                                </Button>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                )}
                                            </AnimatePresence>
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
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={loading || !patientName || !patientId || !studyType || !bodyPart || !modality || !doctor}
                                className="rounded-2xl h-12 px-8 font-extrabold bg-linear-to-r from-[#e05d38] to-[#e05d38] hover:from-[#e05d38] hover:to-[#e05d38] text-white shadow-[0_10px_20px_-10px_rgba(147,51,234,0.4)] hover:shadow-[0_15px_30px_-10px_rgba(147,51,234,0.5)] transition-all duration-300 flex items-center gap-2 min-w-[200px]"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Saving...</span>
                                    </div>
                                ) : (
                                    <>
                                        <span>Add Imaging Study</span>
                                        <ChevronRight className="w-4 h-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
