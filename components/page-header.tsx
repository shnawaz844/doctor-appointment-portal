"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Search, User, FileText, Sparkles, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { NotificationTray } from "@/components/notification-tray"

interface PageHeaderProps {
  title: string
  description?: string
  showSearch?: boolean
  badge?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, description, showSearch = false, badge, actions }: PageHeaderProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      if (searchTerm.length >= 2) {
        try {
          const [patientsRes, reportsRes] = await Promise.all([
            fetch("/api/patients"),
            fetch("/api/reports")
          ])
          const allPatients = await patientsRes.json()
          const allReports = await reportsRes.json()

          const filteredPatients = (Array.isArray(allPatients) ? allPatients : [])
            .filter((p: any) =>
              p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
              p.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .slice(0, 5)
            .map((p: any) => ({ type: "patient", data: p }))

          const filteredReports = (Array.isArray(allReports) ? allReports : [])
            .filter((r: any) =>
              r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              r.type.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .slice(0, 5)
            .map((r: any) => ({ type: "report", data: r }))

          setSearchResults([...filteredPatients, ...filteredReports])
          setShowResults(true)
        } catch (error) {
          console.error("Search fetch failed:", error)
          setSearchResults([])
        }
      } else {
        setSearchResults([])
        setShowResults(false)
      }
    }

    const debounceTimer = setTimeout(fetchData, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchTerm])

  const handleResultClick = (result: any) => {
    if (result.type === "patient") {
      router.push(`/patients/${result.data.id}`)
    }
    setShowResults(false)
    setSearchTerm("")
  }

  const clearSearch = () => {
    setSearchTerm("")
    setShowResults(false)
  }

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        {/* Title Block */}
        <div className="relative flex-1">
          {badge && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-3">
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-widest">{badge}</span>
            </div>
          )}
          <h1 className="flex items-center gap-3 gradient-text">
            {title}
            {/* Animated dot */}
            <span className="relative flex items-center justify-center shrink-0">
              <span className="h-2.5 w-2.5 rounded-full bg-primary inline-block" />
              <span className="absolute h-2.5 w-2.5 rounded-full bg-primary animate-pulse-ring opacity-60" />
            </span>
          </h1>
          {description && (
            <p className="text-sm font-medium text-muted-foreground mt-1.5">
              {description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Search Bar */}
          {showSearch && (
            <div className="relative w-full sm:w-80 md:w-96">
              <div className={cn(
                "relative flex items-center rounded-2xl transition-all duration-300",
                "bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl",
                "border",
                isFocused
                  ? "border-primary/40 shadow-lg shadow-primary/10 ring-4 ring-primary/8"
                  : "border-border/70 shadow-sm hover:shadow-md hover:border-primary/20"
              )}>
                <Search className={cn(
                  "absolute left-3.5 h-4 w-4 transition-colors duration-300 pointer-events-none z-10",
                  isFocused ? "text-primary" : "text-muted-foreground/60"
                )} />
                <Input
                  type="search"
                  placeholder="Search patients, diagnoses..."
                  className="pl-10 pr-10 h-11 bg-transparent border-0 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm font-medium placeholder:text-muted-foreground/50 rounded-2xl"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onBlur={() => {
                    setTimeout(() => setShowResults(false), 200)
                    setIsFocused(false)
                  }}
                  onFocus={() => {
                    if (searchTerm.length >= 2) setShowResults(true)
                    setIsFocused(true)
                  }}
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 p-1 hover:bg-muted/50 rounded-full transition-colors"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>

              {/* Search Results Dropdown */}
              {showResults && searchResults.length > 0 && (
                <div className={cn(
                  "absolute top-full left-0 right-0 mt-2 z-50 overflow-hidden",
                  "glass-premium rounded-2xl shadow-2xl shadow-black/15",
                  "border border-white/30 dark:border-white/8",
                  "animate-in fade-in slide-in-from-top-2 duration-200"
                )}>
                  <div className="px-3 py-2 border-b border-border/30">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {searchResults.length} Results
                    </p>
                  </div>
                  {searchResults.map((result, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 hover:bg-primary/5 cursor-pointer transition-colors border-b border-border/20 last:border-0"
                      onClick={() => handleResultClick(result)}
                    >
                      <div className={cn(
                        "p-2 rounded-xl shrink-0",
                        result.type === "patient"
                          ? "bg-indigo-500/10 text-indigo-500"
                          : "bg-violet-500/10 text-violet-500"
                      )}>
                        {result.type === "patient"
                          ? <User className="h-3.5 w-3.5" />
                          : <FileText className="h-3.5 w-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{result.data.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {result.type === "patient"
                            ? `${result.data.id} · ${result.data.diagnosis}`
                            : result.data.type}
                        </p>
                      </div>
                      <span className={cn(
                        "ml-auto shrink-0 text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider",
                        result.type === "patient"
                          ? "bg-indigo-500/10 text-indigo-500"
                          : "bg-violet-500/10 text-violet-500"
                      )}>
                        {result.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Additional action buttons slot */}
          <div className="flex items-center gap-2">
            <NotificationTray />
            {actions}
          </div>
        </div>
      </div>
    </div>
  )
}
