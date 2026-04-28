"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Check, ChevronsUpDown, User, PlusCircle, Search } from "lucide-react"
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
}

export function CreateInvoiceDialog({ children }: any) {
  const [open, setOpen] = useState(false)
  const [patientId, setPatientId] = useState("")
  const [invoiceType, setInvoiceType] = useState("")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [notes, setNotes] = useState("")
  const [status, setStatus] = useState("Pending")
  const [paymentMethod, setPaymentMethod] = useState("Cash")

  const [patients, setPatients] = useState<Patient[]>([])
  const [loadingPatients, setLoadingPatients] = useState(false)
  const [patientsError, setPatientsError] = useState("")

  const [isManualEntry, setIsManualEntry] = useState(false)
  const [manualPatientName, setManualPatientName] = useState("")
  const [manualPatientPhone, setManualPatientPhone] = useState("")
  const [comboOpen, setComboOpen] = useState(false)

  // Fetch patients whenever the dialog opens
  useEffect(() => {
    if (!open) return
    const fetchPatients = async () => {
      setLoadingPatients(true)
      setPatientsError("")
      try {
        const res = await fetch("/api/patients")
        if (!res.ok) throw new Error("Failed to fetch patients")
        const data: Patient[] = await res.json()
        setPatients(data)
      } catch (err) {
        setPatientsError("Could not load patients. Please try again.")
      } finally {
        setLoadingPatients(false)
      }
    }
    fetchPatients()
  }, [open])

  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if ((!isManualEntry && !patientId) || (isManualEntry && !manualPatientName) || !invoiceType || !amount) {
      alert("Please fill in all required fields.")
      return
    }

    setSubmitting(true)
    try {
      const selectedPatient = !isManualEntry ? patients.find(p => p.id === patientId) : null
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "organization-id": "default-org",
        },
        body: JSON.stringify({
          patientId: isManualEntry ? "WALK-IN" : patientId,
          patientName: isManualEntry ? manualPatientName : (selectedPatient?.name || "Unknown"),
          patientPhone: isManualEntry ? manualPatientPhone : undefined,
          service: invoiceType,
          amount: parseFloat(amount),
          notes: isManualEntry && manualPatientPhone ? `Contact: ${manualPatientPhone}\n${notes}` : notes,
          status,
          paymentMethod,
        }),
      })

      if (!res.ok) throw new Error("Failed to create invoice")

      setOpen(false)
      setManualPatientName("")
      setManualPatientPhone("")
      setInvoiceType("")
      setAmount("")
      setDescription("")
      setNotes("")
      setStatus("Pending")
      setPaymentMethod("Cash")

      // Trigger a refresh of the billing page data if needed
      window.location.reload()
    } catch (err) {
      console.error("Error creating invoice:", err)
      alert("Failed to create invoice. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl p-0">
        <DialogHeader className="px-8 pt-8 pb-4 border-b border-slate-100 dark:border-slate-800">
          <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white">Create Invoice</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 p-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Billing Details</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl w-full">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsManualEntry(false)}
                  className={cn(
                    "flex-1 h-9 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all",
                    !isManualEntry ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" : "text-slate-400"
                  )}
                >
                  <User className="h-3 w-3 mr-2" />
                  Registered Patient
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsManualEntry(true)}
                  className={cn(
                    "flex-1 h-9 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all",
                    isManualEntry ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" : "text-slate-400"
                  )}
                >
                  <PlusCircle className="h-3 w-3 mr-2" />
                  Walk-in / New
                </Button>
              </div>

              {!isManualEntry ? (
                <div className="space-y-2">
                  <Label htmlFor="patientId" className="text-xs font-bold text-slate-700 dark:text-slate-300">Search Patient Name *</Label>
                  <Popover open={comboOpen} onOpenChange={setComboOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={comboOpen}
                        className="w-full h-11 justify-between rounded-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-normal hover:bg-white dark:hover:bg-slate-950"
                        disabled={loadingPatients}
                      >
                        {loadingPatients ? (
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading patients...
                          </span>
                        ) : patientId ? (
                          <span className="font-bold text-slate-900 dark:text-white">
                            {patients.find((p) => p.id === patientId)?.name} ({patientId})
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Search by patient name...</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-[10001]" align="start">
                      <Command className="bg-white dark:bg-slate-950">
                        <CommandInput placeholder="Type name to search..." className="h-11 focus:ring-0 border-none" />
                        <CommandList className="max-h-[300px]">
                          <CommandEmpty className="py-6 text-center text-sm text-slate-500">
                            No patient found.
                          </CommandEmpty>
                          <CommandGroup>
                            {patients.map((patient) => (
                              <CommandItem
                                key={patient.id}
                                value={`${patient.name} ${patient.id}`}
                                onSelect={() => {
                                  setPatientId(patient.id)
                                  setComboOpen(false)
                                }}
                                className="flex items-center justify-between py-3 px-4 aria-selected:bg-blue-50 dark:aria-selected:bg-blue-900/20 cursor-pointer"
                              >
                                <div className="flex flex-col">
                                  <span className="font-black text-sm text-slate-900 dark:text-white">{patient.name}</span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">OPD ID: {patient.id}</span>
                                </div>
                                <Check
                                  className={cn(
                                    "h-4 w-4 text-blue-600",
                                    patientId === patient.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                    <Label htmlFor="manualName" className="text-xs font-bold text-slate-700 dark:text-slate-300">Patient Name *</Label>
                    <Input
                      id="manualName"
                      value={manualPatientName}
                      onChange={(e) => setManualPatientName(e.target.value)}
                      placeholder="Full name"
                      className="h-11 rounded-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manualPhone" className="text-xs font-bold text-slate-700 dark:text-slate-300">Contact Number</Label>
                    <Input
                      id="manualPhone"
                      value={manualPatientPhone}
                      onChange={(e) => setManualPatientPhone(e.target.value)}
                      placeholder="Phone no."
                      className="h-11 rounded-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceType" className="text-xs font-bold text-slate-700 dark:text-slate-300">Invoice Type *</Label>
                <Select value={invoiceType} onValueChange={setInvoiceType}>
                  <SelectTrigger id="invoiceType" className="w-full h-11 rounded-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Hospital Services">Hospital Services</SelectItem>
                    <SelectItem value="Lab Tests">Lab Tests</SelectItem>
                    <SelectItem value="Consultation">Consultation</SelectItem>
                    <SelectItem value="Imaging">Imaging</SelectItem>
                    <SelectItem value="Surgery">Surgery</SelectItem>
                    <SelectItem value="Medication">Medication</SelectItem>
                    <SelectItem value="Physical Therapy">Physical Therapy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status" className="text-xs font-bold text-slate-700 dark:text-slate-300">Invoice Status *</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status" className="w-full h-11 rounded-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod" className="text-xs font-bold text-slate-700 dark:text-slate-300">Payment Method *</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="paymentMethod" className="w-full h-11 rounded-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-xs font-bold text-slate-700 dark:text-slate-300">Amount (₹) *</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g., 5000"
                className="h-11 rounded-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs font-bold text-slate-700 dark:text-slate-300">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., CT Scan - Knee"
                className="h-11 rounded-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-xs font-bold text-slate-700 dark:text-slate-300">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional details or payment terms..."
                rows={3}
                className="rounded-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-3 justify-end px-8 pb-8 pt-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 rounded-b-3xl">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting} className="rounded-xl h-11 px-6 font-bold">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} className="rounded-xl h-11 px-6 font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitting ? "Creating..." : "Create Invoice"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
