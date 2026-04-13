"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export function AddReportDialog({ patientId, patientName, children }: any) {
  const [open, setOpen] = useState(false)
  const [reportType, setReportType] = useState("")
  const [reportName, setReportName] = useState("")
  const [notes, setNotes] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!reportType || !reportName) {
      alert("Please fill in report name and type.")
      return
    }

    setLoading(true)
    try {
      let uploadPath = ""
      if (file) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("bucket", "uploads")
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData })
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          uploadPath = uploadData.url
        } else {
          alert("Failed to upload file.")
          setLoading(false)
          return
        }
      }

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          type: reportType,
          name: reportName,
          date: new Date().toISOString().split("T")[0],
          path: uploadPath
        })
      })

      if (res.ok) {
        setOpen(false)
        setReportType("")
        setReportName("")
        setNotes("")
        setFile(null)
      } else {
        alert("Failed to save report.")
      }
    } catch (error) {
      console.error(error)
      alert("Error adding report")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Medical Report for {patientName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reportType">Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger id="reportType">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="X-Ray">X-Ray</SelectItem>
                <SelectItem value="MRI">MRI</SelectItem>
                <SelectItem value="CT-Scan">CT-Scan</SelectItem>
                <SelectItem value="Ultrasound">Ultrasound</SelectItem>
                <SelectItem value="Physical Therapy">Physical Therapy</SelectItem>
                <SelectItem value="Surgical Notes">Surgical Notes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reportName">Report Name</Label>
            <Input
              id="reportName"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="e.g., Knee_XRay_Follow_Up.pdf"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">Upload File</Label>
            <Input id="file" type="file" accept=".pdf,.jpg,.png,.dcm" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !reportType || !reportName}>
            {loading ? "Adding..." : "Add Report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
