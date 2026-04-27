"use client"

import { useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { requestNotificationPermission, showSystemNotification } from "@/lib/notifications"

export function RealtimeAppointmentListener() {
    const router = useRouter()

    useEffect(() => {
        // Request notification permission when the component mounts
        requestNotificationPermission()

        let channel: any

        const fetchUserAndSubscribe = async () => {
            const meRes = await fetch("/api/auth/me")
            if (!meRes.ok) return
            const { user } = await meRes.json()

            if (user?.role !== "DOCTOR" || !user?.doctor_id) return

            const doctorId = String(user.doctor_id)

            // Subscribe to postgres_changes on the notifications table for real-time alerts
            // Use a unique channel name to avoid "after subscribe" collisions in development
            const channelName = `doctor-alerts-${doctorId}-${Math.random().toString(36).substring(7)}`
            channel = supabase
                .channel(channelName)
                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "notifications",
                        filter: `user_id=eq.${doctorId}`,
                    },
                    (payload) => {
                        const newNotif = payload.new
                        console.log("[Realtime] New notification received:", newNotif)

                        // Check if it's a payment notification
                        if (newNotif.target_type === "doctor" && newNotif.title.includes("Payment")) {
                            // Play sound
                            try {
                                const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3")
                                audio.play().catch(() => { })
                            } catch (e) {
                                console.error("[Realtime] Audio play failed:", e)
                            }

                             toast.success(newNotif.title, {
                                description: newNotif.body,
                                duration: 2000,
                                action: newNotif.data?.appointmentId ? {
                                    label: "Join Session",
                                    onClick: () => window.open(`https://meet.jit.si/appointment-portal-${newNotif.data.appointmentId}`, "_blank"),
                                } : undefined,
                            })

                            // Also show system notification
                            showSystemNotification(newNotif.title, {
                                body: newNotif.body,
                                tag: `payment-${newNotif.id}`,
                            })

                            // Refresh current page data to show the updated status
                            router.refresh()
                        }
                    }
                )
                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "appointments",
                        filter: `doctor_id=eq.${doctorId}`,
                    },
                    (payload) => {
                        const newAppt = payload.new
                        console.log("[Realtime] New appointment received:", newAppt)

                        // Play sound
                        try {
                            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3")
                            audio.play().catch(() => { })
                        } catch (e) { }

                         toast.success(`New Appointment! 📅`, {
                            description: `${newAppt.patient_name} has booked an appointment for ${newAppt.date} at ${newAppt.time || 'ASAP'}`,
                            duration: 5000,
                        })

                        // Also show system notification
                        showSystemNotification(`New Appointment! 📅`, {
                            body: `${newAppt.patient_name} has booked an appointment for ${newAppt.date} at ${newAppt.time || 'ASAP'}`,
                            tag: `appt-${newAppt.id}`,
                        })

                        // Refresh current page data
                        router.refresh()
                    }
                )
                .subscribe((status) => {
                    console.log(`[Realtime] Subscription status for doctor ${doctorId}:`, status)
                })
        }

        fetchUserAndSubscribe()

        return () => {
            if (channel) {
                supabase.removeChannel(channel)
            }
        }
    }, [router])

    return null
}
