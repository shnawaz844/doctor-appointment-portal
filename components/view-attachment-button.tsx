"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ExternalLink, X, Download } from "lucide-react"

interface ViewAttachmentButtonProps {
  url: string
  type?: string
  label?: string
  className?: string
}

export function ViewAttachmentButton({ url, type, label = "View", className }: ViewAttachmentButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const isImage = type?.startsWith("image/")

  const handleView = () => {
    if (isImage) {
      setIsOpen(true)
    } else {
      window.open(url, "_blank")
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={className || "rounded-xl h-9 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest px-4"}
        onClick={handleView}
      >
        {label}
        <ExternalLink className="h-3 w-3 ml-2" />
      </Button>

      {isOpen && isImage && (
        <div 
          className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
        >
          <div className="relative max-w-5xl w-full flex flex-col items-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-12 right-0 text-white hover:bg-white/10 rounded-full"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-8 w-8" />
            </Button>
            <div className="bg-white p-2 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300">
              <img 
                src={url} 
                alt="Attachment Preview" 
                className="max-h-[80vh] w-auto rounded-2xl object-contain mx-auto"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="mt-6 flex gap-4">
              <Button 
                asChild
                className="rounded-full px-8 bg-blue-600 hover:bg-blue-700 shadow-xl"
              >
                <a href={url} download>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </a>
              </Button>
              <Button 
                variant="outline"
                className="rounded-full px-8 bg-white/10 text-white border-white/20 hover:bg-white/20"
                onClick={() => setIsOpen(false)}
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
