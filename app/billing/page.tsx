"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { TrendingUp, Clock, Plus, Loader2, IndianRupee, FileText, Activity, Calendar as CalendarIcon, Filter, Search, ChevronRight } from "lucide-react"
import { CreateInvoiceDialog } from "@/components/create-invoice-dialog"
import { PageHeader } from "@/components/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { StatCard } from "@/components/ui/stat-card"
import { cn } from "@/lib/utils"
import { format, isToday, parseISO, startOfDay, endOfDay } from "date-fns"

interface BillingRecord {
  _id: string
  invoice_id: string
  patient_name: string
  patient_id: string
  amount: number
  date: string
  service: string
  status: "Paid" | "Pending"
  payment_method: "Cash" | "Online"
  created_at: string
}

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState<string>("today")
  const [monthFilter, setMonthFilter] = useState<string>("all")
  const [yearFilter, setYearFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined)
  const [serviceFilter, setServiceFilter] = useState<string>("all")
  const [methodFilter, setMethodFilter] = useState<string>("all")

  const [selectedStat, setSelectedStat] = useState<"revenue" | "outstanding" | "invoices" | null>(null)
  const [invoices, setInvoices] = useState<BillingRecord[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchInvoices() {
    try {
      const res = await fetch("/api/invoices", {
        headers: {
          "organization-id": "default-org"
        }
      })
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setInvoices(data)
    } catch (error) {
      console.error("Failed to fetch invoices:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [])

  // ── Derived Data ──
  const uniqueServices = Array.from(new Set(invoices.map(inv => inv.service))).sort()

  const filteredInvoices = invoices.filter((inv) => {
    const d = inv.date ? parseISO(inv.date) : parseISO(inv.created_at);
    const isTodayRecord = isToday(d);

    if (activeTab === "today") {
      if (!isTodayRecord) return false;
    } else {
      if (isTodayRecord) return false;
      if (monthFilter !== "all" && format(d, "MMM") !== monthFilter) return false;
      if (yearFilter !== "all" && format(d, "yyyy") !== yearFilter) return false;
      if (dateFilter && format(d, "yyyy-MM-dd") !== format(dateFilter, "yyyy-MM-dd")) return false;
    }

    if (serviceFilter !== "all" && inv.service !== serviceFilter) return false;
    if (methodFilter !== "all" && inv.payment_method !== methodFilter) return false;

    return true;
  });

  const stats = {
    totalRevenue: filteredInvoices.reduce((acc, curr) => curr.status === "Paid" ? acc + curr.amount : acc, 0),
    pendingAmount: filteredInvoices.reduce((acc, curr) => curr.status === "Pending" ? acc + curr.amount : acc, 0),
    pendingCount: filteredInvoices.filter(inv => inv.status === "Pending").length,
    totalCount: filteredInvoices.length,
  }

  const getChartData = () => {
    const monthlyGroups: Record<string, number> = {}
    filteredInvoices.forEach(inv => {
      const m = format(inv.date ? parseISO(inv.date) : parseISO(inv.created_at), "MMM")
      monthlyGroups[m] = (monthlyGroups[m] || 0) + inv.amount
    })

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return months
      .filter(m => monthlyGroups[m] !== undefined)
      .map(m => ({ month: m, revenue: monthlyGroups[m] }))
  }

  const revenueBreakdown = [
    { name: "Paid", value: stats.totalRevenue },
    { name: "Pending", value: stats.pendingAmount },
  ]

  const COLORS = ["#10b981", "#f97316"]

  return (
    <main className="relative flex-1 min-h-screen overflow-x-hidden overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-blue-900/20">
      {/* Decorative Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="blob top-[-10%] left-[-10%]" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <div className="container mx-auto relative py-6 md:py-10 px-4 md:px-8">
        <div className="flex flex-col gap-8 mb-10">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Billing & Invoices</h1>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Manage hospital revenue and patient billing</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex p-1 bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-800">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("rounded-xl px-4 font-bold text-xs uppercase tracking-widest transition-all", activeTab === "today" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-lg" : "text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-700/50")}
                  onClick={() => setActiveTab("today")}
                >
                  Today
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("rounded-xl px-4 font-bold text-xs uppercase tracking-widest transition-all", activeTab === "all" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-lg" : "text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-700/50")}
                  onClick={() => setActiveTab("all")}
                >
                  All History
                </Button>
              </div>

              <CreateInvoiceDialog onCreated={fetchInvoices}>
                <Button className="h-11 rounded-xl px-6 bg-[#155dfc] text-white hover:bg-[#2918e1] hover:scale-105 transition-all shadow-lg shadow-[#155dfc]/20 font-bold uppercase tracking-wider text-xs">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
              </CreateInvoiceDialog>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-3">
            <StatCard
              label="Total Revenue"
              value={`₹${stats.totalRevenue.toLocaleString()}`}
              icon={IndianRupee}
              subLabel="Paid invoices"
              colorScheme="emerald"
              loading={loading}
            />
            <StatCard
              label="Pending Amount"
              value={`₹${stats.pendingAmount.toLocaleString()}`}
              icon={Clock}
              subLabel={`${stats.pendingCount} unpaid invoices`}
              colorScheme="amber"
              loading={loading}
            />
            <StatCard
              label="Total Invoices"
              value={stats.totalCount}
              icon={FileText}
              subLabel="Across all time"
              colorScheme="blue"
              loading={loading}
            />
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 mb-10">
          <div className="lg:col-span-2">
            <div className="glass-premium rounded-3xl p-4 md:p-8 hover:shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-6 duration-1000">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Billing Trends</h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Monthly revenue distribution</p>
                </div>
                <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
                  <Button variant="ghost" size="sm" className="bg-white dark:bg-slate-700 shadow-sm rounded-lg font-bold text-xs h-8">Month</Button>
                </div>
              </div>

              <div className="h-[350px]">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getChartData()}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }} tickFormatter={(value) => `₹${value / 1000}k`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '16px', border: 'none', backdropFilter: 'blur(10px)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                        formatter={(value) => [`₹${Number(value).toLocaleString()}`, "Revenue"]}
                      />
                      <Bar dataKey="revenue" fill="url(#colorRevenue)" radius={[6, 6, 0, 0]} barSize={40} />
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#059669" stopOpacity={0.8} />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <Card className="border-none glass-premium rounded-3xl animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-150">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-black text-slate-900 dark:text-white">Revenue Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] relative">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={revenueBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={8}
                          dataKey="value"
                        >
                          {revenueBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '16px', border: 'none', backdropFilter: 'blur(10px)' }}
                          formatter={(value) => `₹${Number(value).toLocaleString()}`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
                      <span className="text-lg font-black text-slate-900 dark:text-white">₹{(stats.totalRevenue + stats.pendingAmount).toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>
              <div className="mt-6 space-y-3">
                {revenueBreakdown.map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.name}</span>
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white">₹{item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Billing Records Table & Tabs */}
        <div className="glass-premium rounded-3xl p-4 md:p-8 hover:shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
          <Tabs defaultValue="today" className="w-full" onValueChange={setActiveTab}>
            <div className="flex flex-col gap-8 mb-10">
              {/* Row 1: Title, Tabs, and Create Button */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Billing Records</h3>
                  <TabsList className="bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-1 h-11 rounded-xl w-fit">
                    <TabsTrigger value="today" className="rounded-lg px-6 font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm transition-all text-xs">
                      Todays Billing
                    </TabsTrigger>
                    <TabsTrigger value="all" className="rounded-lg px-6 font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm transition-all text-xs">
                      All Billing
                    </TabsTrigger>
                  </TabsList>
                </div>

                <CreateInvoiceDialog onCreated={fetchInvoices}>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8 h-12 shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95 font-bold">
                    <Plus className="h-5 w-5 mr-2" />
                    Create Invoice
                  </Button>
                </CreateInvoiceDialog>
              </div>

              {/* Row 2: Filters */}
              <div className="flex flex-wrap items-center gap-4 p-2 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                <div className="px-4 py-2 flex items-center gap-2 border-r border-slate-200 dark:border-slate-700/50 mr-2">
                  <Filter className="h-4 w-4 text-slate-400" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Data Filters</span>
                </div>

                {/* Service Filter */}
                <div className="flex items-center gap-3 px-3 py-1.5 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm">
                  <div className="flex items-center gap-2 pr-3 border-r border-slate-100 dark:border-slate-700">
                    <Activity className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Service</span>
                  </div>
                  <Select value={serviceFilter} onValueChange={setServiceFilter}>
                    <SelectTrigger className="h-7 min-w-[130px] border-none bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-black p-0 focus:ring-0">
                      <SelectValue placeholder="All Services" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                      <SelectItem value="all">All Services</SelectItem>
                      {uniqueServices.map(service => (
                        <SelectItem key={service} value={service}>{service}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment Method Filter */}
                <div className="flex items-center gap-3 px-3 py-1.5 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm">
                  <div className="flex items-center gap-2 pr-3 border-r border-slate-100 dark:border-slate-700">
                    <IndianRupee className="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Method</span>
                  </div>
                  <Select value={methodFilter} onValueChange={setMethodFilter}>
                    <SelectTrigger className="h-7 min-w-[100px] border-none bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-black p-0 focus:ring-0">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                      <SelectItem value="all">All Methods</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Online">Online</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* All Billing Specific Filters */}
                {activeTab === "all" && (
                  <>
                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2" />

                    {/* Month Filter */}
                    <div className="flex items-center gap-2">
                      <Select value={monthFilter} onValueChange={setMonthFilter}>
                        <SelectTrigger className="h-9 min-w-[110px] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold shadow-sm">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-3 w-3 text-slate-400" />
                            <SelectValue placeholder="Month" />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                          <SelectItem value="all">Every Month</SelectItem>
                          {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(m => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Year Filter */}
                      <Select value={yearFilter} onValueChange={setYearFilter}>
                        <SelectTrigger className="h-9 min-w-[90px] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold shadow-sm">
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                          <SelectItem value="all">All Years</SelectItem>
                          {["2024", "2025", "2026"].map(y => (
                            <SelectItem key={y} value={y}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Date Picker Filter */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className={cn(
                            "h-9 px-4 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 transition-all",
                            dateFilter ? "border-primary text-primary bg-primary/5" : "text-slate-600 dark:text-slate-300"
                          )}>
                            <Clock className="h-3.5 w-3.5 mr-2 opacity-70" />
                            {dateFilter ? format(dateFilter, "dd MMM yyyy") : "Pick Date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl" align="end">
                          <Calendar
                            mode="single"
                            selected={dateFilter}
                            onSelect={setDateFilter}
                            initialFocus
                            className="rounded-2xl"
                          />
                          {dateFilter && (
                            <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-2xl">
                              <Button variant="ghost" size="sm" className="w-full text-xs font-bold text-slate-500 hover:text-red-500" onClick={() => setDateFilter(undefined)}>
                                Clear Date
                              </Button>
                            </div>
                          )}
                        </PopoverContent>
                      </Popover>
                    </div>
                  </>
                )}

                {/* Reset All (If any filter is active) */}
                {(serviceFilter !== "all" || methodFilter !== "all" || monthFilter !== "all" || yearFilter !== "all" || dateFilter) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 px-4 rounded-xl"
                    onClick={() => {
                      setServiceFilter("all")
                      setMethodFilter("all")
                      setMonthFilter("all")
                      setYearFilter("all")
                      setDateFilter(undefined)
                    }}
                  >
                    Reset Filters
                  </Button>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto bg-white/30 dark:bg-slate-950/30">
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                  <TableRow className="hover:bg-transparent border-slate-200 dark:border-slate-800">
                    <TableHead className="w-[60px] font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">S.no</TableHead>
                    <TableHead className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Invoice ID</TableHead>
                    <TableHead className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Patient Name</TableHead>
                    <TableHead className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Service</TableHead>
                    <TableHead className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Amount</TableHead>
                    <TableHead className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Method</TableHead>
                    <TableHead className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Date</TableHead>
                    <TableHead className="text-right font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin mx-auto text-emerald-500 mb-4" />
                        <span className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Syncing financial records...</span>
                      </TableCell>
                    </TableRow>
                  ) : filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-24 text-slate-500 dark:text-slate-400">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-black tracking-tight mb-1">No Records Found</p>
                        <p className="text-sm font-medium opacity-60">Try adjusting your filters or tabs</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvoices.map((record, index) => (
                      <TableRow key={record._id} className="group hover:bg-emerald-500/5 dark:hover:bg-emerald-400/5 border-slate-100 dark:border-slate-800 transition-all duration-300">
                        <TableCell className="font-black text-slate-400 group-hover:text-emerald-600 transition-colors">{index + 1}</TableCell>
                        <TableCell className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">{record.invoice_id}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 dark:text-white">{record.patient_name}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{record.patient_id}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-bold text-slate-700 dark:text-slate-300">{record.service}</TableCell>
                        <TableCell className="font-black text-slate-900 dark:text-white text-base">₹{record.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-bold text-[10px] border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm px-2.5 py-0.5">
                            {record.payment_method || "Cash"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm font-bold text-slate-600 dark:text-slate-400">
                          {format(record.date ? parseISO(record.date) : parseISO(record.created_at), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            className={cn(
                              "font-black text-[10px] px-3 py-1 rounded-lg border",
                              record.status === "Paid"
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                            )}
                          >
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full mr-2",
                              record.status === "Paid" ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                            )} />
                            {record.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Tabs>
        </div>
      </div>
    </main>
  )
}
