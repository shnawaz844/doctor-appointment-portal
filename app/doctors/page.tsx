"use client"

import { useState, useEffect, useRef } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, UserPlus, ImagePlus, X, Eye, EyeOff, Trash2, Pencil } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { resolveImageUrl } from "@/lib/image-url"

export default function DoctorsPage() {
    const [doctors, setDoctors] = useState<any[]>([])
    const [specialties, setSpecialties] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState({ name: "", specialty: "", phone: "", email: "", password: "", image: "", fee: "", emergency_fee: "" })
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [doctorStatus, setDoctorStatus] = useState<"active" | "inactive">("active")
    const [editingDoctor, setEditingDoctor] = useState<any | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const addDoctorCardRef = useRef<HTMLDivElement>(null)
    const [syncedCardHeight, setSyncedCardHeight] = useState<number | null>(null)
    const [isDesktop, setIsDesktop] = useState(false)

    useEffect(() => {
        const mediaQuery = window.matchMedia("(min-width: 768px)")
        const updateViewport = () => setIsDesktop(mediaQuery.matches)
        updateViewport()

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener("change", updateViewport)
            return () => mediaQuery.removeEventListener("change", updateViewport)
        }

        mediaQuery.addListener(updateViewport)
        return () => mediaQuery.removeListener(updateViewport)
    }, [])

    useEffect(() => {
        if (!addDoctorCardRef.current) return

        const updateHeight = () => {
            setSyncedCardHeight(addDoctorCardRef.current?.offsetHeight ?? null)
        }

        updateHeight()
        const resizeObserver = new ResizeObserver(updateHeight)
        resizeObserver.observe(addDoctorCardRef.current)

        return () => resizeObserver.disconnect()
    }, [])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImageFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const removeImage = () => {
        setImageFile(null)
        setImagePreview(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const fetchData = async () => {
        try {
            const [docsRes, specsRes] = await Promise.all([
                fetch(`/api/doctors?status=${doctorStatus}`),
                fetch("/api/specialties")
            ])
            const docsData = await docsRes.json()
            const specsData = await specsRes.json()
            setDoctors(Array.isArray(docsData) ? docsData : [])
            setSpecialties(Array.isArray(specsData) ? specsData : [])
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [doctorStatus])

    const handleDeleteDoctor = async (doctorId: string, doctorName: string) => {
        const isConfirmed = window.confirm(`Move ${doctorName} to inactive doctors?`)
        if (!isConfirmed) return

        try {
            const res = await fetch(`/api/doctors?id=${doctorId}`, { method: "DELETE" })
            const data = await res.json()

            if (!res.ok) {
                setError(data.error || "Failed to deactivate doctor")
                return
            }

            fetchData()
        } catch (e: any) {
            setError(e.message || "Failed to deactivate doctor")
        }
    }

    const handleEditClick = (doctor: any) => {
        setEditingDoctor(doctor)
        setFormData({
            name: doctor.name || "",
            specialty: doctor.specialty_id || "",
            phone: doctor.phone || "",
            email: doctor.email || "",
            password: "", // Don't pre-fill password for security
            image: doctor.image || "",
            fee: doctor.fee || "",
            emergency_fee: doctor.emergency_fee || ""
        })
        setImagePreview(resolveImageUrl(doctor.image))
        // Scroll to form
        addDoctorCardRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    const handleCancelEdit = () => {
        setEditingDoctor(null)
        setFormData({ name: "", specialty: "", phone: "", email: "", password: "", image: "", fee: "", emergency_fee: "" })
        setImageFile(null)
        setImagePreview(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name || !formData.specialty) return
        setSubmitting(true)
        setError(null)
        try {
            let imageUrl = formData.image

            if (imageFile) {
                const uploadData = new FormData()
                uploadData.append("file", imageFile)
                const uploadRes = await fetch("/api/doctors/upload", {
                    method: "POST",
                    body: uploadData
                })
                const uploadResult = await uploadRes.json()
                if (uploadResult.success) {
                    imageUrl = uploadResult.url
                } else {
                    throw new Error(uploadResult.error || "Upload failed")
                }
            }

            const specId = formData.specialty

            if (editingDoctor) {
                const res = await fetch("/api/doctors", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id: editingDoctor.id,
                        name: formData.name,
                        specialty_id: specId,
                        phone: formData.phone,
                        email: formData.email,
                        password: formData.password || undefined,
                        image: imageUrl,
                        fee: formData.fee,
                        emergency_fee: formData.emergency_fee
                    }),
                })
                if (res.ok) {
                    handleCancelEdit()
                    fetchData()
                } else {
                    const errData = await res.json()
                    setError(errData.error || "Failed to update doctor")
                }
            } else {
                const res = await fetch("/api/doctors", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: formData.name,
                        specialty_id: specId,
                        phone: formData.phone,
                        email: formData.email,
                        password: formData.password,
                        image: imageUrl,
                        fee: formData.fee,
                        emergency_fee: formData.emergency_fee
                    }),
                })
                if (res.ok) {
                    setFormData({ name: "", specialty: "", phone: "", email: "", password: "", image: "", fee: "", emergency_fee: "" })
                    setImageFile(null)
                    setImagePreview(null)
                    if (fileInputRef.current) fileInputRef.current.value = ""
                    fetchData()
                } else {
                    const errData = await res.json()
                    setError(errData.error || "Failed to add doctor")
                }
            }
        } catch (error: any) {
            console.error(error)
            setError(error.message || "An unexpected error occurred")
        } finally {
            setSubmitting(false)
        }
    }

    const getspecialtyName = (id: string) => {
        return specialties.find(s => s.id === id)?.name || "Unknown"
    }

    return (
        <main className="flex-1">
            <div className="container mx-auto py-6 md:py-8 px-4 md:px-8">
                <PageHeader title="Doctors" description="Manage medical staff" />

                <div className="grid gap-6 md:grid-cols-2 md:items-start">
                    <Card ref={addDoctorCardRef}>
                        <CardHeader>
                            <CardTitle>{editingDoctor ? "Edit Doctor" : "Add New Doctor"}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Doctor Name *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Dr. John Doe"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="specialty">Specialty *</Label>
                                    <Select
                                        value={formData.specialty}
                                        onValueChange={(value) => setFormData({ ...formData, specialty: value })}
                                    >
                                        <SelectTrigger id="specialty">
                                            <SelectValue placeholder="Select specialty" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {specialties.map((s) => (
                                                <SelectItem key={s.id} value={s.id}>
                                                    {s.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input
                                            id="phone"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="Phone number"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="Email address"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="fee">Doctor's Appointment Fee</Label>
                                        <Input
                                            id="fee"
                                            type="number"
                                            value={formData.fee}
                                            onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                                            placeholder="Consultation Fee"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="emergency_fee">Emergency Appointment Fee</Label>
                                        <Input
                                            id="emergency_fee"
                                            type="number"
                                            value={formData.emergency_fee}
                                            onChange={(e) => setFormData({ ...formData, emergency_fee: e.target.value })}
                                            placeholder="Emergency Fee"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 mt-4">
                                    <Label>Doctor Profile Image</Label>
                                    <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed rounded-lg hover:bg-muted/50 transition-colors cursor-pointer relative"
                                        onClick={() => fileInputRef.current?.click()}>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                        {imagePreview ? (
                                            <div className="relative group w-32 h-32">
                                                <img
                                                    src={imagePreview}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover rounded-full border shadow-sm"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        removeImage()
                                                    }}
                                                    className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                <div className="p-3 rounded-full bg-primary/10">
                                                    <ImagePlus className="w-6 h-6 text-primary" />
                                                </div>
                                                <p className="text-sm font-medium">Click to upload photo</p>
                                                <p className="text-xs">PNG, JPG or WebP (max 5MB)</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">{editingDoctor ? "Update Password (optional)" : "Login Password *"}</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            placeholder={editingDoctor ? "Leave blank to keep current password" : "Set password for doctor login"}
                                            className="pr-10"
                                            required={!editingDoctor}
                                        />
                                        <button
                                            type="button"
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                            onClick={() => setShowPassword((prev) => !prev)}
                                            className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-muted-foreground hover:text-foreground"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                {error && (
                                    <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
                                        {error}
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <Button type="submit" disabled={submitting} className="flex-1">
                                        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                                        {editingDoctor ? "Update Doctor" : "Add Doctor"}
                                    </Button>
                                    {editingDoctor && (
                                        <Button type="button" variant="outline" onClick={handleCancelEdit}>
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <Card
                        className="flex flex-col overflow-hidden"
                        style={isDesktop && syncedCardHeight ? { height: `${syncedCardHeight}px` } : undefined}
                    >
                        <CardHeader className="space-y-3">
                            <CardTitle>Existing Doctors</CardTitle>
                            <div className="inline-flex rounded-md border p-1 bg-muted/30">
                                <button
                                    type="button"
                                    onClick={() => setDoctorStatus("active")}
                                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${doctorStatus === "active" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                                >
                                    Active
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDoctorStatus("inactive")}
                                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${doctorStatus === "inactive" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                                >
                                    Inactive
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 min-h-0">
                            {loading ? (
                                <div className="flex justify-center p-4">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <ScrollArea className="h-full pr-4">
                                    <div className="space-y-2 pb-2">
                                        {doctors.length === 0 ? (
                                            <p className="text-sm text-muted-foreground italic">No doctors found.</p>
                                        ) : (
                                            doctors.map((d) => (
                                                <div key={d.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full overflow-hidden bg-muted shrink-0">
                                                            {resolveImageUrl(d.image) ? (
                                                                <img src={resolveImageUrl(d.image)} alt={d.name} className="h-full w-full object-cover" />
                                                            ) : (
                                                                <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                                                                    {d.name.charAt(0)}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{d.name}</p>
                                                            <p className="text-xs text-primary font-semibold">{getspecialtyName(d.specialty_id)}</p>
                                                            <p className="text-xs text-muted-foreground">{d.email || d.phone || "No contact info"}</p>
                                                            {(d.fee || d.emergency_fee) && (
                                                                <div className="flex gap-2 mt-1">
                                                                    {d.fee > 0 && <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Fee: ₹{d.fee}</span>}
                                                                    {d.emergency_fee > 0 && <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Emergency: ₹{d.emergency_fee}</span>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        {doctorStatus === "active" && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleEditClick(d)}
                                                                    className="p-2 rounded-md text-primary hover:bg-primary/10 transition-colors"
                                                                    aria-label={`Edit ${d.name}`}
                                                                    title="Edit Doctor"
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteDoctor(d.id, d.name)}
                                                                    className="p-2 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                                                                    aria-label={`Delete ${d.name}`}
                                                                    title="Move to inactive"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </ScrollArea>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    )
}
