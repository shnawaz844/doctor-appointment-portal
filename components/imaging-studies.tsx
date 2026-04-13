"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Trash2, Scan, Activity, Calendar, Stethoscope, ImageIcon, ChevronRight, AlertCircle, User, Activity as ActivityIcon, Maximize2, ZoomIn, X } from "lucide-react"
import { DeleteImagingDialog } from "./delete-imaging-dialog"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface ImagingStudiesProps {
  studies?: any[]
}

export function ImagingStudies({ studies = [] }: ImagingStudiesProps) {
  const [selectedImage, setSelectedImage] = useState<any>(null)
  const [maximizedImage, setMaximizedImage] = useState<string | null>(null)

  return (
    <>
      <Card className="border-none shadow-none bg-transparent">

        <CardContent className="px-0">
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {studies.length > 0 ? studies.map((study, idx) => (
              <motion.div
                key={study.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="group relative rounded-4xl border border-slate-200/60 dark:border-white/5 p-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md hover:border-blue-500/30 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1"
              >
                <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-3xl mb-4 flex items-center justify-center relative overflow-hidden group-hover:shadow-lg transition-all duration-500">
                  <Image
                    src={(() => {
                      try {
                        const parsed = JSON.parse(study.thumbnail || "[]")
                        return Array.isArray(parsed) ? (parsed[0] || "/placeholder.svg") : (study.thumbnail || "/placeholder.svg")
                      } catch {
                        return study.thumbnail || "/placeholder.svg"
                      }
                    })()}
                    alt={study.study_type}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {(() => {
                    try {
                      const parsed = JSON.parse(study.thumbnail || "[]")
                      if (Array.isArray(parsed) && parsed.length > 1) {
                        return (
                          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[9px] font-black px-2.5 py-1 rounded-full border border-white/20 tracking-widest shadow-lg">
                            {parsed.length} IMAGES
                          </div>
                        )
                      }
                    } catch { null }
                    return null
                  })()}
                  <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="px-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 transition-colors uppercase tracking-tight text-sm">
                      {study.study_type === 'X-ray' && study.modality === 'Other' ? 'Image from PGF app' : study.study_type}
                    </p>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full group-hover:animate-pulse" />
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 mb-4">
                    <Calendar className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{study.date}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-10 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-white/5 font-bold text-xs hover:bg-[#e05d38] hover:text-white hover:border-[#e05d38] transition-all duration-300"
                      onClick={() => setSelectedImage(study)}
                    >
                      View Study
                    </Button>
                    <DeleteImagingDialog imagingId={study.id} studyType={study.study_type}>
                      <Button variant="ghost" size="sm" className="h-10 w-10 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 transition-all">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DeleteImagingDialog>
                  </div>
                </div>
              </motion.div>
            )) : (
              <div className="col-span-3 text-center py-20 bg-slate-50/50 dark:bg-slate-900/20 rounded-4xl border-2 border-dashed border-slate-200 dark:border-white/5">
                <div className="flex flex-col items-center">
                  <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-400 mb-4">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <p className="font-bold text-slate-500 uppercase tracking-widest text-xs">No imaging studies records found</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AnimatePresence>
        {selectedImage && (
          <Dialog open={!!selectedImage} onOpenChange={(open) => {
            if (!open) {
              setSelectedImage(null)
              setMaximizedImage(null)
            }
          }}>
            <DialogContent className={cn(
              "max-w-6xl max-h-[95vh] bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border-slate-200/50 dark:border-white/10 shadow-[0_32px_64px_-15px_rgba(0,0,0,0.2)] rounded-4xl p-0 overflow-hidden border transition-all duration-500",
              maximizedImage && "max-w-[100vw] max-h-[100vh] h-screen w-screen rounded-none bg-black/95 backdrop-blur-3xl border-none shadow-none"
            )}>
              <AnimatePresence>
                {!maximizedImage && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <DialogHeader className="px-8 pt-8 pb-6 bg-linear-to-r from-blue-600/10 via-transparent to-purple-600/10 border-b border-slate-100 dark:border-white/5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl -mr-16 -mt-16 rounded-full" />
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 blur-3xl -ml-12 -mb-12 rounded-full" />

                      <div className="flex items-start justify-between relative">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-[#e05d38] rounded-2xl shadow-lg shadow-blue-500/20 text-white">
                            <Scan className="w-6 h-6" />
                          </div>
                          <div>
                            <DialogTitle className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                              {selectedImage.study_type === 'X-ray' && selectedImage.modality === 'Other' ? 'Image from PGF app' : selectedImage.study_type}
                            </DialogTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">
                                Imaging Study
                              </span>
                              <span className="text-xs font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1.5 ml-2">
                                <Calendar className="w-3 h-3" />
                                {selectedImage.date}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </DialogHeader>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className={cn(
                "flex flex-col",
                maximizedImage ? "h-screen" : "h-[calc(95vh-140px)]"
              )}>
                <div className={cn(
                  "flex-1 overflow-y-auto custom-scrollbar",
                  maximizedImage ? "p-0 bg-black" : "p-0 bg-slate-50/30 dark:bg-slate-950/30"
                )}>
                  {maximizedImage ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative w-full h-full flex items-center justify-center p-4"
                    >
                      <Image
                        src={maximizedImage}
                        alt="Enlarged View"
                        fill
                        className="object-contain"
                        priority
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMaximizedImage(null)}
                        className="absolute top-6 right-6 rounded-full h-12 w-12 bg-white/10 text-white hover:bg-white/20 transition-all border border-white/10 z-50 backdrop-blur-md"
                      >
                        <X className="w-6 h-6" />
                      </Button>
                    </motion.div>
                  ) : (
                    <div className="p-8 space-y-8">
                      <div className="space-y-6">
                        {(() => {
                          let images: string[] = []
                          try {
                            const parsed = JSON.parse(selectedImage.thumbnail || "[]")
                            images = Array.isArray(parsed) ? parsed : [selectedImage.thumbnail || "/placeholder.svg"]
                          } catch {
                            images = [selectedImage.thumbnail || "/placeholder.svg"]
                          }

                          return (
                            <div className="grid grid-cols-1 gap-8">
                              {images.map((src, i) => (
                                <motion.div
                                  key={`${selectedImage.id}-${i}`}
                                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  transition={{ duration: 0.5, delay: i * 0.1 }}
                                  className="relative w-full aspect-video bg-black rounded-4xl overflow-hidden border border-slate-200 dark:border-white/5 shadow-2xl group/img"
                                >
                                  <Image
                                    src={src}
                                    alt={`${selectedImage.study_type} - Image ${i + 1}`}
                                    fill
                                    sizes="(max-width: 1440px) 100vw, 1200px"
                                    className="object-contain"
                                    priority={i === 0}
                                  />
                                  <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button
                                      onClick={() => setMaximizedImage(src)}
                                      className="rounded-full h-14 w-14 bg-white/20 backdrop-blur-xl border border-white/40 text-white hover:bg-white/40 transition-all scale-90 group-hover/img:scale-100"
                                    >
                                      <Maximize2 className="w-6 h-6" />
                                    </Button>
                                  </div>

                                  <div className="absolute bottom-6 right-6 flex items-center gap-3">
                                    <div className="bg-black/40 backdrop-blur-md text-white text-[10px] font-black px-4 py-2 rounded-full border border-white/10 tracking-[0.2em] uppercase shadow-lg">
                                      IMAGE {i + 1} / {images.length}
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {!maximizedImage && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="px-8 py-5 bg-white/50 dark:bg-slate-900/60 backdrop-blur-xl border-t border-slate-100 dark:border-white/5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Medical Record Verified</span>
                      </div>
                      <Button
                        onClick={() => setSelectedImage(null)}
                        className="rounded-2xl h-11 px-8 font-extrabold bg-[#e05d38] hover:bg-[#e05d38]/90 text-white shadow-lg transition-all"
                      >
                        Done
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

    </>
  )
}
