"use client"

import { useState, useEffect, useRef } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, UserPlus, ImagePlus, X } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function DoctorsPage() {
    const [doctors, setDoctors] = useState<any[]>([])
    const [specialties, setSpecialties] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState({ name: "", specialty: "", phone: "", email: "", password: "", image: "" })
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

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
                fetch("/api/doctors"),
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
    }, [])

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

            let specId = specialties.find(s => s.name.toLowerCase() === formData.specialty.trim().toLowerCase())?.id

            if (!specId) {
                const specRes = await fetch("/api/specialties", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: formData.specialty.trim(), description: "Auto-created specialty" })
                })
                const newSpec = await specRes.json()
                specId = newSpec.id
            }

            const res = await fetch("/api/doctors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    specialty_id: specId,
                    phone: formData.phone,
                    email: formData.email,
                    password: formData.password,
                    image: imageUrl
                }),
            })
            if (res.ok) {
                setFormData({ name: "", specialty: "", phone: "", email: "", password: "", image: "" })
                setImageFile(null)
                setImagePreview(null)
                if (fileInputRef.current) fileInputRef.current.value = ""
                fetchData()
            } else {
                const errData = await res.json()
                setError(errData.error || "Failed to add doctor")
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

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Add New Doctor</CardTitle>
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
                                    <Input
                                        id="specialty"
                                        list="specialties-list"
                                        value={formData.specialty}
                                        onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                                        placeholder="Type or select specialty"
                                        required
                                    />
                                    <datalist id="specialties-list">
                                        {specialties.map(s => (
                                            <option key={s.id} value={s.name} />
                                        ))}
                                    </datalist>
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
                                <div className="space-y-2">
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
                                    <Label htmlFor="password">Login Password *</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="Set password for doctor login"
                                        required
                                    />
                                </div>
                                {error && (
                                    <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
                                        {error}
                                    </div>
                                )}
                                <Button type="submit" disabled={submitting} className="w-full">
                                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                                    Add Doctor
                                </Button>

                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Existing Doctors</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex justify-center p-4">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <ScrollArea className="h-[400px] pr-4">
                                    <div className="space-y-2">
                                        {doctors.length === 0 ? (
                                            <p className="text-sm text-muted-foreground italic">No doctors found.</p>
                                        ) : (
                                            doctors.map((d) => (
                                                <div key={d.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full overflow-hidden bg-muted shrink-0">
                                                            {d.image ? (
                                                                <img src={d.image} alt={d.name} className="h-full w-full object-cover" />
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
                                                        </div>
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
