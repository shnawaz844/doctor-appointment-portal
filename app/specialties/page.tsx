"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function SpecialtiesPage() {
    const [specialties, setSpecialties] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState({ name: "", description: "" })

    const fetchSpecialties = async () => {
        try {
            const res = await fetch("/api/specialties")
            const data = await res.json()
            setSpecialties(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSpecialties()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name) return
        setSubmitting(true)
        try {
            const res = await fetch("/api/specialties", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })
            if (res.ok) {
                setFormData({ name: "", description: "" })
                fetchSpecialties()
            }
        } catch (error) {
            console.error(error)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <main className="flex-1">
            <div className="container mx-auto py-6 md:py-8 px-4 md:px-8">
                <PageHeader title="Specialties" description="Manage medical specialties" />

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Add New specialty</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">specialty Name *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Cardiology"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Brief description..."
                                    />
                                </div>
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                                    Add specialty
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Existing Specialties</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex justify-center p-4">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <ScrollArea className="h-[400px] pr-4">
                                    <div className="space-y-2">
                                        {specialties.length === 0 ? (
                                            <p className="text-sm text-muted-foreground italic">No specialties found.</p>
                                        ) : (
                                            specialties.map((s) => (
                                                <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                    <div>
                                                        <p className="font-medium">{s.name}</p>
                                                        {s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}
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
