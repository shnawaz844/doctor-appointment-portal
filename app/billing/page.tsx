"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { TrendingUp, Clock, Plus, Loader2, DollarSign, FileText, Activity } from "lucide-react"
import { CreateInvoiceDialog } from "@/components/create-invoice-dialog"
import { PageHeader } from "@/components/page-header"

interface BillingRecord {
  _id: string
  invoiceId: string
  patientName: string
  patientId: string
  amount: number
  date: string
  service: string
  status: "Paid" | "Pending"
  paymentMethod: "Cash" | "Online"
  createdAt: string
}

export default function BillingPage() {
  const [timeFilter, setTimeFilter] = useState<"day" | "month" | "year">("month")
  const [selectedStat, setSelectedStat] = useState<"revenue" | "outstanding" | "invoices" | null>(null)
  const [invoices, setInvoices] = useState<BillingRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
    fetchInvoices()
  }, [])

  const stats = {
    totalRevenue: invoices.reduce((acc, curr) => curr.status === "Paid" ? acc + curr.amount : acc, 0),
    outstanding: invoices.reduce((acc, curr) => curr.status === "Pending" ? acc + curr.amount : acc, 0),
    totalInvoices: invoices.length,
  }

  const getChartData = () => {
    // Basic aggregation: group by month
    const monthlyGroups: Record<string, number> = {}
    invoices.forEach(inv => {
      const month = new Date(inv.date || inv.createdAt).toLocaleString("default", { month: "short" })
      monthlyGroups[month] = (monthlyGroups[month] || 0) + inv.amount
    })

    // Sort months correctly (simplified)
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return months
      .filter(m => monthlyGroups[m] !== undefined)
      .map(m => ({ month: m, revenue: monthlyGroups[m] }))
  }

  const revenueBreakdown = [
    { name: "Paid", value: stats.totalRevenue },
    { name: "Pending", value: stats.outstanding },
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
        <PageHeader title="Billing & Invoice" description="Manage invoices and patient billing" showSearch />

        {/* Billing Stats */}
        <div className="grid gap-4 md:gap-8 grid-cols-1 md:grid-cols-3 mb-8 md:mb-10">
          <Card
            className="group relative overflow-hidden border-none bg-emerald-500/10 dark:bg-emerald-600/20 backdrop-blur-xl border-t border-l border-white/40 dark:border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-500 cursor-pointer"
            onClick={() => setSelectedStat("revenue")}
          >
            <div className="absolute inset-0 bg-linear-to-br from-emerald-500/20 via-emerald-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-[0.2em]">Total Revenue</CardTitle>
              <div className="p-2.5 bg-emerald-500/20 dark:bg-emerald-400/20 rounded-xl group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500 shadow-lg shadow-emerald-500/20">
                <TrendingUp className="h-5 w-5 text-emerald-700 dark:text-emerald-300 group-hover:text-white transition-colors" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10 pt-4">
              {loading ? <Loader2 className="h-6 w-6 animate-spin text-emerald-600" /> : (
                <>
                  <div className="text-4xl font-black tracking-tight text-emerald-900 dark:text-white group-hover:translate-x-1 transition-transform duration-500">₹{stats.totalRevenue.toLocaleString()}</div>
                  <div className="flex items-center mt-3">
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-100 bg-emerald-500/10 dark:bg-emerald-400/10 px-2 py-1 rounded-lg border border-emerald-200/50 dark:border-emerald-700/50">Paid</span>
                    <span className="text-[11px] font-medium text-emerald-700/70 dark:text-emerald-300/70 ml-2">Total earnings</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card
            className="group relative overflow-hidden border-none bg-amber-500/10 dark:bg-amber-600/20 backdrop-blur-xl border-t border-l border-white/40 dark:border-amber-500/30 hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-500 cursor-pointer"
            onClick={() => setSelectedStat("outstanding")}
          >
            <div className="absolute inset-0 bg-linear-to-br from-amber-500/20 via-amber-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-[0.2em]">Outstanding</CardTitle>
              <div className="p-2.5 bg-amber-500/20 dark:bg-amber-400/20 rounded-xl group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all duration-500 shadow-lg shadow-amber-500/20">
                <Clock className="h-5 w-5 text-amber-700 dark:text-amber-300 group-hover:text-white transition-colors" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10 pt-4">
              {loading ? <Loader2 className="h-6 w-6 animate-spin text-amber-600" /> : (
                <>
                  <div className="text-4xl font-black tracking-tight text-amber-900 dark:text-white group-hover:translate-x-1 transition-transform duration-500">₹{stats.outstanding.toLocaleString()}</div>
                  <div className="flex items-center mt-3">
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-100 bg-amber-500/10 dark:bg-amber-400/10 px-2 py-1 rounded-lg border border-amber-200/50 dark:border-amber-700/50 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Pending
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card
            className="group relative overflow-hidden border-none bg-blue-500/10 dark:bg-blue-600/20 backdrop-blur-xl border-t border-l border-white/40 dark:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 cursor-pointer"
            onClick={() => setSelectedStat("invoices")}
          >
            <div className="absolute inset-0 bg-linear-to-br from-blue-500/20 via-blue-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-[0.2em]">Total Invoices</CardTitle>
              <div className="p-2.5 bg-blue-500/20 dark:bg-blue-400/20 rounded-xl group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-lg shadow-blue-500/20">
                <FileText className="h-5 w-5 text-blue-700 dark:text-blue-300 group-hover:text-white transition-colors" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10 pt-4">
              {loading ? <Loader2 className="h-6 w-6 animate-spin text-blue-600" /> : (
                <>
                  <div className="text-4xl font-black tracking-tight text-blue-900 dark:text-white group-hover:translate-x-1 transition-transform duration-500">{stats.totalInvoices}</div>
                  <p className="text-[11px] font-medium text-blue-700/70 dark:text-blue-300/70 mt-3">Generated this period</p>
                </>
              )}
            </CardContent>
          </Card>
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
                      <span className="text-lg font-black text-slate-900 dark:text-white">₹{(stats.totalRevenue + stats.outstanding).toLocaleString()}</span>
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

        {/* Billing Records Table */}
        <div className="glass-premium rounded-3xl p-4 md:p-8 hover:shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Recent Invoices</h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Chronological list of all billing activity</p>
            </div>
            <CreateInvoiceDialog>
              <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95">
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </CreateInvoiceDialog>
          </div>


          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto bg-white/30 dark:bg-slate-950/30">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                <TableRow className="hover:bg-transparent border-slate-200 dark:border-slate-800">
                  <TableHead className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Invoice ID</TableHead>
                  <TableHead className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Patient Name</TableHead>
                  <TableHead className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Patient ID</TableHead>
                  <TableHead className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Service</TableHead>
                  <TableHead className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Amount</TableHead>
                  <TableHead className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Method</TableHead>
                  <TableHead className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Date</TableHead>
                  <TableHead className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-20">
                      <Loader2 className="h-10 w-10 animate-spin mx-auto text-emerald-500 mb-4" />
                      <span className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Syncing financial data...</span>
                    </TableCell>
                  </TableRow>
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-20 text-slate-500 dark:text-slate-400 font-medium">
                      No financial records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((record) => (
                    <TableRow key={record._id} className="hover:bg-emerald-500/5 dark:hover:bg-emerald-400/5 border-slate-100 dark:border-slate-800 transition-colors">
                      <TableCell className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">{record.invoiceId}</TableCell>
                      <TableCell className="font-black text-slate-900 dark:text-white">{record.patientName}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-500">{record.patientId}</TableCell>
                      <TableCell className="text-sm font-medium text-slate-700 dark:text-slate-300">{record.service}</TableCell>
                      <TableCell className="font-black text-slate-900 dark:text-white">₹{record.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-bold text-[10px] border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                          {record.paymentMethod || "Cash"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-slate-600 dark:text-slate-400">{new Date(record.date || record.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            record.status === "Paid"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                          }
                        >
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${record.status === "Paid" ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                          {record.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </main>
  )
}
