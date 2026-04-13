"use client"

import { useEffect, useState } from "react"
import { Label, Pie, PieChart } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Diagnosis } from "@/lib/data"
import { Loader2 } from "lucide-react"

const chartConfig = {
  count: {
    label: "Patients",
  },
  "Knee Osteoarthritis": {
    label: "Knee Osteoarthritis",
    color: "hsl(var(--chart-1))",
  },
  "Lumbar Disc Herniation": {
    label: "Lumbar Disc Herniation",
    color: "hsl(var(--chart-2))",
  },
  "Rotator Cuff Tear": {
    label: "Rotator Cuff Tear",
    color: "hsl(var(--chart-3))",
  },
  "Cervical Spondylosis": {
    label: "Cervical Spondylosis",
    color: "hsl(var(--chart-4))",
  },
  "Ankle Fracture": {
    label: "Ankle Fracture",
    color: "hsl(var(--chart-5))",
  },
  "Meniscal Tear": {
    label: "Meniscal Tear",
    color: "hsl(var(--chart-6))",
  },
  Tendinitis: {
    label: "Tendinitis",
    color: "hsl(var(--chart-7))",
  },
  "Hip Dysplasia": {
    label: "Hip Dysplasia",
    color: "hsl(var(--chart-8))",
  },
} satisfies ChartConfig

export function DiagnosisChart() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAndProcessData() {
      try {
        const response = await fetch("/api/patients")
        const patients = await response.json()

        if (Array.isArray(patients)) {
          // Group patients by diagnosis
          const distribution: { [key: string]: number } = {}
          patients.forEach((p: any) => {
            const diag = p.diagnosis || "Unknown"
            distribution[diag] = (distribution[diag] || 0) + 1
          })

          // Transform into chart-friendly format
          const chartData = Object.entries(distribution).map(([name, count], index) => ({
            name,
            count,
            fill: `var(--color-chart-${(index % 8) + 1})`
          }))

          setData(chartData)
        }
      } catch (error) {
        console.error("Failed to fetch and process diagnoses:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchAndProcessData()
  }, [])

  const totalPatients = data.reduce((acc, curr) => acc + curr.count, 0)

  return (
    <div className="flex items-center pb-0 w-full">
      {loading ? (
        <div className="flex justify-center items-center h-[250px] w-full">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px] w-full">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie data={data} dataKey="count" nameKey="name" innerRadius={70} strokeWidth={5}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={viewBox.cy} className="fill-slate-900 dark:fill-white text-3xl font-black">
                          {totalPatients.toLocaleString()}
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-slate-500 dark:fill-slate-400 text-xs font-bold uppercase tracking-wider">
                          Total Patients
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      )}
    </div>
  )
}

