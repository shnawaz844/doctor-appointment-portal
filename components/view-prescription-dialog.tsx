"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, User, FileText, Pill, ClipboardList, ExternalLink, FileImage } from "lucide-react"

interface ViewPrescriptionDialogProps {
    prescription: {
        id: string
        patient_name: string
        patient_id: string
        doctor_name: string
        issued: string
        status: string
        medications?: {
            medication: string
            dosage: string
            quantity: number
        }[]
        instructions?: string
        duration?: string
        attachment_url?: string
        attachment_type?: string
    }
    children: React.ReactNode
}

export function ViewPrescriptionDialog({ prescription, children }: ViewPrescriptionDialogProps) {
    const isImage = prescription.attachment_type?.startsWith("image/")
    const isPdf = prescription.attachment_type?.includes("pdf")

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl p-0 custom-scrollbar">
                <DialogHeader className="px-8 pt-8 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white">Prescription Detail</DialogTitle>
                            <p className="text-sm font-medium text-slate-500 mt-1">Prescription #{prescription.id}</p>
                        </div>
                        <Badge
                            className={
                                prescription.status === "Active"
                                    ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 px-3 py-1 rounded-full"
                                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700 px-3 py-1 rounded-full"
                            }
                        >
                            <span className={`w-1.5 h-1.5 rounded-full mr-2 ${prescription.status === "Active" ? "bg-blue-500 animate-pulse" : "bg-slate-400"}`} />
                            {prescription.status}
                        </Badge>
                    </div>
                </DialogHeader>

                <div className="p-8 space-y-8">
                    {/* Header Info */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <User className="h-3 w-3" />
                                Patient
                            </div>
                            <p className="font-black text-slate-900 dark:text-white">{prescription.patient_name}</p>
                            <p className="text-[10px] font-mono opacity-50 uppercase">ID: {prescription.patient_id}</p>
                        </div>
                        <div className="space-y-1.5 text-right">
                            <div className="flex items-center gap-2 justify-end text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <Calendar className="h-3 w-3" />
                                Issued Date
                            </div>
                            <p className="font-bold text-slate-900 dark:text-white">{prescription.issued}</p>
                            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">{prescription.doctor_name}</p>
                        </div>
                    </div>

                    <Separator className="bg-slate-100 dark:bg-slate-800" />

                    {/* Medications */}
                    {prescription.medications && prescription.medications.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <Pill className="h-3 w-3" />
                                Prescribed Medications
                            </div>
                            <div className="grid gap-3">
                                {prescription.medications.map((m, idx) => (
                                    <div key={idx} className="p-4 bg-slate-50/80 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                                <Pill className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{m.medication}</p>
                                                <p className="text-[10px] text-slate-500 font-medium">{m.dosage}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-slate-900 dark:text-white">{m.quantity} Units</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Instructions */}
                    {prescription.instructions && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <ClipboardList className="h-3 w-3" />
                                Instructions
                            </div>
                            <div className="p-6 bg-blue-50/50 dark:bg-blue-500/5 rounded-2xl border border-blue-100 dark:border-blue-900/10 shadow-inner">
                                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 font-medium italic">
                                    "{prescription.instructions}"
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Internal File Viewer */}
                    {prescription.attachment_url && (
                        <div className="space-y-4 pt-4">
                             <Separator className="bg-slate-100 dark:bg-slate-800 mb-6" />
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <FileImage className="h-3 w-3" />
                                    Prescription File
                                </div>
                                <a
                                    href={prescription.attachment_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest flex items-center gap-1"
                                >
                                    Full View <ExternalLink className="h-2 w-2" />
                                </a>
                            </div>

                            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-2 min-h-[300px]">
                                {isImage ? (
                                    <img
                                        src={prescription.attachment_url}
                                        alt="Prescription Attachment"
                                        className="max-w-full h-auto rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800"
                                    />
                                ) : isPdf ? (
                                    <div className="flex flex-col items-center gap-4 py-12 w-full h-full">
                                        <div className="p-4 bg-rose-500/10 rounded-2xl">
                                            <FileText className="w-12 h-12 text-rose-500" />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-bold text-slate-900 dark:text-white">PDF Prescription</p>
                                            <p className="text-xs text-slate-500 mt-1">Click below to view the full document</p>
                                        </div>
                                        <a
                                            href={prescription.attachment_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-8 py-3 bg-rose-500 text-white rounded-xl font-bold text-sm hover:bg-rose-600 hover:scale-105 transition-all shadow-lg shadow-rose-500/20"
                                        >
                                            Open PDF Prescription
                                        </a>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-4 py-8">
                                       <FileText className="h-8 w-8 text-slate-400" />
                                       <a
                                            href={prescription.attachment_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm font-bold text-blue-600 hover:underline"
                                        >
                                            View Clinical Attachment
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
