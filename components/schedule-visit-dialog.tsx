"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export function ScheduleVisitDialog({ patientId, patientName, children }: any) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [doctor, setDoctor] = useState("")
  const [visitType, setVisitType] = useState("")
  const [notes, setNotes] = useState("")

  const handleSubmit = () => {
    console.log("[v0] Scheduling visit:", { patientId, date, time, doctor, visitType, notes })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule Visit for {patientName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="doctor">Doctor</Label>
            <Select value={doctor} onValueChange={setDoctor}>
              <SelectTrigger id="doctor">
                <SelectValue placeholder="Select doctor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Dr. Sharma">Dr. Sharma</SelectItem>
                <SelectItem value="Dr. Singh">Dr. Singh</SelectItem>
                <SelectItem value="Dr. Verma">Dr. Verma</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="visitType">Visit Type</Label>
            <Select value={visitType} onValueChange={setVisitType}>
              <SelectTrigger id="visitType">
                <SelectValue placeholder="Select visit type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Consultation">Consultation</SelectItem>
                <SelectItem value="Follow-up">Follow-up</SelectItem>
                <SelectItem value="Physical Therapy">Physical Therapy</SelectItem>
                <SelectItem value="Surgery">Surgery</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Schedule Visit</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
