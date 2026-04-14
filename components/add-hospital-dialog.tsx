"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Building2, MapPin, Phone, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function AddHospitalDialog({ 
  children, 
  onSuccess, 
  hospital 
}: { 
  children: React.ReactNode, 
  onSuccess?: () => void,
  hospital?: any
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    hospital_name: "",
    location: "",
    phone_number: "",
    address: "",
    status: "Active",
  })

  useEffect(() => {
    if (hospital) {
      setFormData({
        hospital_name: hospital.hospital_name || "",
        location: hospital.location || "",
        phone_number: hospital.phone_number || "",
        address: hospital.address || "",
        status: hospital.status || "Active",
      })
    } else {
      setFormData({
        hospital_name: "",
        location: "",
        phone_number: "",
        address: "",
        status: "Active",
      })
    }
  }, [hospital, open])

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.hospital_name) newErrors.hospital_name = "Facility name is required"
    if (!formData.location) newErrors.location = "Location is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setLoading(true)
    try {
      const method = hospital ? "PUT" : "POST"
      const payload = hospital ? { ...formData, id: hospital.id } : formData

      const response = await fetch("/api/hospitals", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setOpen(false)
        if (onSuccess) onSuccess()
      } else {
        const error = await response.json()
        alert(`Failed to save facility: ${error.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error saving hospital:", error)
      alert("An error occurred while saving the facility")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10 rounded-[2rem] p-0 overflow-hidden border">
        <DialogHeader className="px-8 pt-8 pb-6 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {hospital ? "Edit Facility" : "Add New Facility"}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {hospital ? "Update detailed information for this facility" : "Onboard a new hospital or clinic to the platform"}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="hospital_name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Facility Name <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="hospital_name"
                  value={formData.hospital_name}
                  onChange={(e) => setFormData({ ...formData, hospital_name: e.target.value })}
                  placeholder="e.g., City General Hospital"
                  className={cn("h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-transparent focus:bg-white dark:focus:bg-slate-950 transition-all", errors.hospital_name && "border-destructive/50 bg-destructive/5")}
                />
              </div>
              {errors.hospital_name && <p className="text-[11px] font-medium text-destructive mt-1">{errors.hospital_name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Short Location <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Bangalore North"
                  className={cn("h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-transparent focus:bg-white dark:focus:bg-slate-950 pl-10 transition-all", errors.location && "border-destructive/50 bg-destructive/5")}
                />
              </div>
              {errors.location && <p className="text-[11px] font-medium text-destructive mt-1">{errors.location}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Contact Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="+91-000-000-0000"
                  className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-transparent focus:bg-white dark:focus:bg-slate-950 pl-10 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Account Status
              </Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger id="status" className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-transparent focus:bg-white dark:focus:bg-slate-950 transition-all">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="address" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Full Address
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street address, building, etc."
                className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-transparent focus:bg-white dark:focus:bg-slate-950 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-end px-8 py-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-white/5">
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            className="rounded-xl h-11 px-6 font-bold text-muted-foreground"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-xl h-11 px-8 font-bold flex items-center gap-2 min-w-[140px]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>{hospital ? "Save Changes" : "Onboard Facility"}</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
