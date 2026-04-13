"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Trash2, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface DeleteImagingDialogProps {
  imagingId: string
  studyType: string
  children: React.ReactNode
}

export function DeleteImagingDialog({ imagingId, studyType, children }: DeleteImagingDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/imaging/${imagingId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast.success("Imaging study deleted successfully")
        setOpen(false)
        router.refresh()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to delete imaging study")
      }
    } catch (error) {
      console.error("Error deleting imaging study:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl p-0 overflow-hidden">
        <DialogHeader className="px-8 pt-8 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle className="text-xl font-black text-slate-900 dark:text-white">Delete Imaging Study</DialogTitle>
          </div>
        </DialogHeader>
        <div className="p-8 space-y-4">
          <DialogDescription className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            Are you sure you want to delete the imaging study <span className="font-bold text-slate-900 dark:text-white">{studyType}</span>? 
            This action cannot be undone and will permanently remove the record from the system.
          </DialogDescription>
        </div>
        <DialogFooter className="flex gap-3 justify-end px-8 pb-8 pt-2 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 rounded-b-3xl">
          <Button 
            variant="ghost" 
            onClick={() => setOpen(false)} 
            disabled={loading}
            className="rounded-full px-6 font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={loading}
            className="rounded-full px-8 h-11 bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] font-bold"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Permanently
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
