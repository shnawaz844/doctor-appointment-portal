"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideIcon, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

export type ColorScheme = "blue" | "emerald" | "amber" | "rose" | "violet" | "cyan" | "indigo" | "slate"

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  subValue?: string | number
  subLabel?: string
  loading?: boolean
  onClick?: () => void
  colorScheme: ColorScheme
  className?: string
  idx?: number
}

const COLOR_CONFIGS: Record<ColorScheme, any> = {
  blue: {
    gradient: "from-blue-500/15 via-blue-400/8 to-transparent",
    iconBg: "bg-blue-500/15 dark:bg-blue-500/20",
    iconColor: "text-blue-600 dark:text-blue-400",
    hoverShadow: "hover:shadow-blue-500/20",
    borderHover: "group-hover:border-blue-500/30",
    badgeBg: "bg-blue-500/10 dark:bg-blue-400/10",
    badgeBorder: "border-blue-200/50 dark:border-blue-700/50",
    badgeText: "text-blue-700 dark:text-blue-300",
    accentBar: "from-blue-500 to-blue-400",
  },
  emerald: {
    gradient: "from-emerald-500/15 via-teal-500/8 to-transparent",
    iconBg: "bg-emerald-500/15 dark:bg-emerald-500/20",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    hoverShadow: "hover:shadow-emerald-500/20",
    borderHover: "group-hover:border-emerald-500/30",
    badgeBg: "bg-emerald-500/10 dark:bg-emerald-400/10",
    badgeBorder: "border-emerald-200/50 dark:border-emerald-700/50",
    badgeText: "text-emerald-700 dark:text-emerald-300",
    accentBar: "from-emerald-500 to-teal-500",
  },
  amber: {
    gradient: "from-amber-500/15 via-orange-500/8 to-transparent",
    iconBg: "bg-amber-500/15 dark:bg-amber-500/20",
    iconColor: "text-amber-600 dark:text-amber-400",
    hoverShadow: "hover:shadow-amber-500/20",
    borderHover: "group-hover:border-amber-500/30",
    badgeBg: "bg-amber-500/10 dark:bg-amber-400/10",
    badgeBorder: "border-amber-200/50 dark:border-amber-700/50",
    badgeText: "text-amber-700 dark:text-amber-300",
    accentBar: "from-amber-500 to-orange-400",
  },
  rose: {
    gradient: "from-rose-500/15 via-pink-500/8 to-transparent",
    iconBg: "bg-rose-500/15 dark:bg-rose-500/20",
    iconColor: "text-rose-600 dark:text-rose-400",
    hoverShadow: "hover:shadow-rose-500/20",
    borderHover: "group-hover:border-rose-500/30",
    badgeBg: "bg-rose-500/10 dark:bg-rose-400/10",
    badgeBorder: "border-rose-200/50 dark:border-rose-700/50",
    badgeText: "text-rose-700 dark:text-rose-300",
    accentBar: "from-rose-500 to-pink-500",
  },
  violet: {
    gradient: "from-violet-500/15 via-purple-500/8 to-transparent",
    iconBg: "bg-violet-500/15 dark:bg-violet-500/20",
    iconColor: "text-violet-600 dark:text-violet-400",
    hoverShadow: "hover:shadow-violet-500/20",
    borderHover: "group-hover:border-violet-500/30",
    badgeBg: "bg-violet-500/10 dark:bg-violet-400/10",
    badgeBorder: "border-violet-200/50 dark:border-violet-700/50",
    badgeText: "text-violet-700 dark:text-violet-300",
    accentBar: "from-violet-500 to-purple-500",
  },
  cyan: {
    gradient: "from-cyan-500/15 via-teal-500/8 to-transparent",
    iconBg: "bg-cyan-500/15 dark:bg-cyan-500/20",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    hoverShadow: "hover:shadow-cyan-500/20",
    borderHover: "group-hover:border-cyan-500/30",
    badgeBg: "bg-cyan-500/10 dark:bg-cyan-400/10",
    badgeBorder: "border-cyan-200/50 dark:border-cyan-700/50",
    badgeText: "text-cyan-700 dark:text-cyan-300",
    accentBar: "from-cyan-400 to-teal-500",
  },
  indigo: {
    gradient: "from-indigo-500/15 via-blue-500/8 to-transparent",
    iconBg: "bg-indigo-500/15 dark:bg-indigo-500/20",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    hoverShadow: "hover:shadow-indigo-500/20",
    borderHover: "group-hover:border-indigo-500/30",
    badgeBg: "bg-indigo-500/10 dark:bg-indigo-400/10",
    badgeBorder: "border-indigo-200/50 dark:border-indigo-700/50",
    badgeText: "text-indigo-700 dark:text-indigo-300",
    accentBar: "from-indigo-500 to-blue-500",
  },
  slate: {
    gradient: "from-slate-500/15 via-slate-400/8 to-transparent",
    iconBg: "bg-slate-500/15 dark:bg-slate-500/20",
    iconColor: "text-slate-600 dark:text-slate-400",
    hoverShadow: "hover:shadow-slate-500/20",
    borderHover: "group-hover:border-slate-500/30",
    badgeBg: "bg-slate-500/10 dark:bg-slate-400/10",
    badgeBorder: "border-slate-200/50 dark:border-slate-700/50",
    badgeText: "text-slate-700 dark:text-slate-300",
    accentBar: "from-slate-500 to-slate-400",
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
}

export function StatCard({
  label,
  value,
  icon: Icon,
  subValue,
  subLabel,
  loading,
  onClick,
  colorScheme,
  className,
  idx = 0,
}: StatCardProps) {
  const config = COLOR_CONFIGS[colorScheme]

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="show"
      className={cn("h-full", className)}
    >
      <div
        onClick={onClick}
        className={cn(
          "group relative h-full overflow-hidden rounded-3xl cursor-pointer bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl transition-all duration-400 border border-white/50 dark:border-white/8 hover:shadow-2xl hover:-translate-y-1",
          config.hoverShadow,
          config.borderHover
        )}
      >
        {/* Accent top bar */}
        <div
          className={cn(
            "absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl bg-gradient-to-r opacity-60 group-hover:opacity-100 transition-opacity",
            config.accentBar
          )}
        />

        {/* Gradient overlay on hover */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
            config.gradient
          )}
        />

        <CardHeader className="flex flex-row items-center justify-between pb-3 relative z-10 pt-5 px-5">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground/80">
            {label}
          </CardTitle>
          <div
            className={cn(
              "p-2.5 rounded-2xl transition-all duration-400 shadow-sm",
              config.iconBg,
              "group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-md"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5 transition-colors duration-300",
                config.iconColor
              )}
            />
          </div>
        </CardHeader>

        <CardContent className="relative z-10 px-5 pb-5">
          {loading ? (
            <div className="space-y-2">
              <div className="h-10 w-24 rounded-xl bg-muted/40 animate-pulse" />
              <div className="h-4 w-32 rounded-lg bg-muted/30 animate-pulse" />
            </div>
          ) : (
            <>
              <div className="text-4xl font-black tracking-tight text-foreground mb-3 group-hover:translate-x-0.5 transition-transform duration-400">
                {value}
              </div>
              {(subValue !== undefined || subLabel) && (
                <div className="flex items-center gap-2">
                  {subValue !== undefined && (
                    <span
                      className={cn(
                        "text-[10px] font-black px-2.5 py-1 rounded-lg border flex items-center gap-1",
                        config.badgeBg,
                        config.badgeBorder,
                        config.badgeText
                      )}
                    >
                      {subValue}
                    </span>
                  )}
                  {subLabel && (
                    <span className="text-[11px] font-medium text-muted-foreground/70">
                      {subLabel}
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>

        {/* Corner arrow indicator */}
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
          <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
        </div>
      </div>
    </motion.div>
  )
}
