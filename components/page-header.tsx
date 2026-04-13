"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { FileText, User } from "lucide-react"

interface PageHeaderProps {
  title: string
  description?: string
  showSearch?: boolean
}

export function PageHeader({ title, description, showSearch = false }: PageHeaderProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)
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

  return (
    <div className="mb-6 md:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-1 md:mb-1.5 flex items-center gap-3">
            {title}
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse hidden sm:inline-block" />
          </h1>
          {description && <p className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
        {showSearch && (
          <div className="relative w-full sm:max-w-md group/search">

            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within/search:text-blue-500 transition-colors duration-300 z-10" />
            <Input
              type="search"
              placeholder="Search patients, diagnoses, reports..."
              className="pl-11 pr-4 py-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-slate-200 dark:border-slate-800 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
              onFocus={() => searchTerm.length >= 2 && setShowResults(true)}
            />
            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className="p-3 hover:bg-accent cursor-pointer border-b border-border last:border-0"
                    onClick={() => handleResultClick(result)}
                  >
                    {result.type === "patient" ? (
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-primary" />
                        <div>
                          <p className="font-medium text-foreground">{result.data.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {result.data.id} • {result.data.diagnosis}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-chart-3" />
                        <div>
                          <p className="font-medium text-foreground">{result.data.name}</p>
                          <p className="text-xs text-muted-foreground">{result.data.type}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
