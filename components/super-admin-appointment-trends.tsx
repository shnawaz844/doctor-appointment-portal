"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarCheck, CalendarDays, Loader2 } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

type AppointmentRecord = {
  id: string
  created_at?: string
  date?: string
}

type Period = "daily" | "monthly" | "yearly"

const chartConfig = {
  count: {
    label: "Appointments",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

const DAILY_POINTS = 14
const MONTHLY_POINTS = 12
const YEARLY_POINTS = 5

function formatKey(period: Period, date: Date) {
  if (period === "daily") return date.toISOString().slice(0, 10)
  if (period === "monthly") return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
  return String(date.getFullYear())
}

export function SuperAdminAppointmentTrends() {
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("daily")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAppointments() {
      try {
        const response = await fetch("/api/appointments")
        const data = await response.json()
        setAppointments(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Failed to fetch appointment trends:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAppointments()
  }, [])

  const { dailyCount, monthlyCount, yearlyCount, chartData, totalInRange } = useMemo(() => {
    const now = new Date()
    const sourceDates = appointments
      .map((appt) => new Date(appt.created_at || appt.date || ""))
      .filter((date) => !Number.isNaN(date.getTime()))

    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    const todayCount = sourceDates.filter((date) => date >= startOfToday).length
    const thisMonthCount = sourceDates.filter((date) => date >= startOfMonth).length
    const thisYearCount = sourceDates.filter((date) => date >= startOfYear).length

    const buckets = new Map<string, number>()
    const labels = new Map<string, string>()

    if (selectedPeriod === "daily") {
      for (let i = DAILY_POINTS - 1; i >= 0; i -= 1) {
        const date = new Date(now)
        date.setDate(now.getDate() - i)
        const key = formatKey("daily", date)
        buckets.set(key, 0)
        labels.set(key, date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }))
      }
    } else if (selectedPeriod === "monthly") {
      for (let i = MONTHLY_POINTS - 1; i >= 0; i -= 1) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const key = formatKey("monthly", date)
        buckets.set(key, 0)
        labels.set(key, date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }))
      }
    } else {
      for (let i = YEARLY_POINTS - 1; i >= 0; i -= 1) {
        const date = new Date(now.getFullYear() - i, 0, 1)
        const key = formatKey("yearly", date)
        buckets.set(key, 0)
        labels.set(key, date.getFullYear().toString())
      }
    }

    sourceDates.forEach((date) => {
      const key = formatKey(selectedPeriod, date)
      if (buckets.has(key)) {
        buckets.set(key, (buckets.get(key) || 0) + 1)
      }
    })

    const trendData = Array.from(buckets.entries()).map(([key, value]) => ({
      key,
      label: labels.get(key) || key,
      count: value,
    }))

    return {
      dailyCount: todayCount,
      monthlyCount: thisMonthCount,
      yearlyCount: thisYearCount,
      chartData: trendData,
      totalInRange: trendData.reduce((sum, item) => sum + item.count, 0),
    }
  }, [appointments, selectedPeriod])

  return (
    <Card className="border-none glass-premium rounded-3xl animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-150 overflow-hidden group h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl font-black text-slate-900 dark:text-white">Appointment Activity Analytics</CardTitle>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Daily, monthly, and yearly appointment activity in current hospital</p>
          </div>
          <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
            <CalendarCheck className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-slate-200/60 dark:border-white/10 p-3 bg-white/40 dark:bg-white/5">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Today</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{dailyCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/60 dark:border-white/10 p-3 bg-white/40 dark:bg-white/5">
            <p className="text-[10px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-400">This Month</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{monthlyCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/60 dark:border-white/10 p-3 bg-white/40 dark:bg-white/5">
            <p className="text-[10px] font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400">This Year</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{yearlyCount}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as Period)}>
            <TabsList className="rounded-xl">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">Yearly</TabsTrigger>
            </TabsList>
          </Tabs>

          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            Total in range: {totalInRange}
          </p>
        </div>

        <div className="h-[170px]">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-full w-full">
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={12} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={26} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
