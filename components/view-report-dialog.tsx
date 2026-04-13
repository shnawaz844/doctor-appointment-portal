"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

export function ViewReportDialog({ report, children }: any) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{report.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-3">
            <div>
              <p className="font-medium text-muted-foreground">Report Type</p>
              <p className="text-foreground mt-1">{report.type}</p>
            </div>
            <Separator />
            <div>
              <p className="font-medium text-muted-foreground">Date</p>
              <p className="text-foreground mt-1">{report.date}</p>
            </div>
            <Separator />
            <div>
              <p className="font-medium text-muted-foreground">File Location</p>
              <p className="text-foreground mt-1 font-mono text-xs">{report.path}</p>
            </div>
          </div>
          <div className="bg-muted rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-4">Report Content</h3>
            <div className="space-y-4 text-sm">
              <p className="text-foreground">
                This is a sample report viewing interface. In a production environment, this would display the actual
                PDF content or medical imaging with detailed findings, impressions, and recommendations from the
                radiologist or specialist.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
