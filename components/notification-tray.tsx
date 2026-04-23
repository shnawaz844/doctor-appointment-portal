"use client"

import { useState, useEffect } from "react"
import { Bell, Check, Trash2, Clock, Calendar, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { formatDistanceToNow } from "date-fns"

export function NotificationTray() {
    const [notifications, setNotifications] = useState<any[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [doctorId, setDoctorId] = useState<string | null>(null)

    useEffect(() => {
        async function init() {
            const meRes = await fetch("/api/auth/me")
            if (!meRes.ok) return
            const { user } = await meRes.json()
            if (user?.doctor_id) {
                const id = String(user.doctor_id)
                setDoctorId(id)
                fetchNotifications(id)

                // Subscribe to new notifications
                const channel = supabase
                    .channel(`doctor-notifications-${id}`)
                    .on(
                        "postgres_changes",
                        {
                            event: "INSERT",
                            schema: "public",
                            table: "notifications",
                            filter: `user_id=eq.${id}`,
                        },
                        (payload) => {
                            console.log("[Tray] New notification caught in tray:", payload.new)
                            fetchNotifications(id)
                        }
                    )
                    .subscribe((status) => {
                        console.log(`[Tray] Notification subscription status for doctor ${id}:`, status)
                    })

                return () => {
                    supabase.removeChannel(channel)
                }
            }
        }
        init()
    }, [])

    async function fetchNotifications(id: string) {
        setLoading(true)
        const { data, error } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", id)
            .eq("target_type", "doctor")
            .order("created_at", { ascending: false })
            .limit(20)

        if (!error && data) {
            setNotifications(data)
            setUnreadCount(data.filter(n => !n.is_read).length)
        }
        setLoading(false)
    }

    async function markAsRead(id: string) {
        const { error } = await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("id", id)

        if (!error) {
            setNotifications(prev =>
                prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
            )
            setUnreadCount(prev => Math.max(0, prev - 1))
        }
    }

    async function markAllAsRead() {
        if (!doctorId) return
        const { error } = await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("user_id", doctorId)
            .eq("is_read", false)

        if (!error) {
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
            setUnreadCount(0)
        }
    }

    async function deleteNotification(id: string) {
        const { error } = await supabase
            .from("notifications")
            .delete()
            .eq("id", id)

        if (!error) {
            setNotifications(prev => prev.filter(n => n.id !== id))
            const deleted = notifications.find(n => n.id === id)
            if (deleted && !deleted.is_read) {
                setUnreadCount(prev => Math.max(0, prev - 1))
            }
        }
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-11 w-11 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-border/70 hover:border-primary/20 hover:bg-primary/5 transition-all"
                >
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2.5 right-2.5 h-4 min-w-4 flex items-center justify-center rounded-full bg-primary text-[10px] font-black text-white px-1 shadow-lg shadow-primary/20 ring-2 ring-white dark:ring-slate-900 animate-in zoom-in duration-300">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 rounded-3xl bg-white dark:bg-slate-950 shadow-2xl border border-slate-200 dark:border-slate-800" align="end">
                <div className="p-4 border-b border-border/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h4 className="font-black text-sm uppercase tracking-widest text-foreground">Notifications</h4>
                        <Badge variant="secondary" className="h-5 rounded-lg px-2 text-[10px] font-bold">
                            {notifications.length}
                        </Badge>
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[10px] font-bold text-primary hover:text-primary hover:bg-primary/10 rounded-lg px-2"
                            onClick={markAllAsRead}
                        >
                            Mark all as read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[400px]">
                    {loading && notifications.length === 0 ? (
                        <div className="p-8 text-center">
                            <Clock className="h-8 w-8 text-muted-foreground/30 animate-pulse mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground font-medium">Loading notifications...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center">
                            <Bell className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground font-medium">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/20">
                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={cn(
                                        "p-4 transition-colors relative group",
                                        !n.is_read ? "bg-primary/[0.03] dark:bg-primary/[0.02]" : "hover:bg-muted/30"
                                    )}
                                >
                                    {!n.is_read && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                                    )}
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <h5 className="font-bold text-sm text-foreground pr-6 line-clamp-1">{n.title}</h5>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {!n.is_read && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 rounded-lg text-emerald-500 hover:bg-emerald-500/10"
                                                    onClick={() => markAsRead(n.id)}
                                                    title="Mark as read"
                                                >
                                                    <Check className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 rounded-lg text-rose-500 hover:bg-rose-500/10"
                                                onClick={() => deleteNotification(n.id)}
                                                title="Delete"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">{n.body}</p>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 font-medium">
                                            <Clock className="h-3 w-3" />
                                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                        </div>

                                        {n.data?.appointmentId && (
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="h-6 text-[9px] font-black uppercase tracking-widest px-2.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border-0"
                                                onClick={() => {
                                                    if (n.title.includes("Payment")) {
                                                        window.open(`https://meet.jit.si/appointment-portal-${n.data.appointmentId}`, '_blank')
                                                    } else {
                                                        window.location.href = `/appointments?id=${n.data.appointmentId}`
                                                    }
                                                }}
                                            >
                                                <Video className="h-2.5 w-2.5 mr-1" />
                                                Action
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <div className="p-3 border-t border-border/30 bg-muted/20">
                    <Button
                        variant="ghost"
                        className="w-full h-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted/50 rounded-xl"
                    >
                        View All Activity
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}
