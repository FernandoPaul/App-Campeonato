"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useRef, useEffect } from "react"
import { format, addDays, isSameDay, startOfToday, parse } from "date-fns"
import { es } from "date-fns/locale"

export default function MatchDateFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const today = startOfToday()
  const selectedDateStr = searchParams.get("date")
  const selectedDate = selectedDateStr 
    ? parse(selectedDateStr, "yyyy-MM-dd", new Date()) 
    : today

  // Generate a window of dates (e.g. 5 days back, 10 days forward)
  const dates = Array.from({ length: 15 }, (_, i) => addDays(today, i - 5))

  // Scroll current date into view on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const selectedEl = scrollContainerRef.current.querySelector('[data-selected="true"]')
      if (selectedEl) {
        selectedEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
      }
    }
  }, [selectedDateStr])

  const handleDateClick = (date: Date) => {
    const formattedDate = format(date, "yyyy-MM-dd")
    const params = new URLSearchParams(searchParams.toString())
    params.set("date", formattedDate)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      })
    }
  }

  const rawMonth = format(selectedDate, "MMMM", { locale: es })
  const currentMonthName = rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1)

  const getLabel = (date: Date) => {
    if (isSameDay(date, today)) return "Hoy"
    if (isSameDay(date, addDays(today, -1))) return "Ayer"
    if (isSameDay(date, addDays(today, 1))) return "Mañana"
    return format(date, "EEE dd", { locale: es })
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-bold text-white">Mes del calendario:</span>
        <span className="text-sm font-bold text-white capitalize">{currentMonthName}</span>
      </div>
      
      <div className="flex items-center gap-2 group">
        <button 
          onClick={() => scroll("left")}
          className="p-2 text-zinc-400 hover:text-white transition-colors"
          aria-label="Anterior"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div 
          ref={scrollContainerRef}
          className="flex flex-1 overflow-x-auto hide-scrollbar gap-3 scroll-smooth snap-x pb-2 pt-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {dates.map((date) => {
            const isSelected = isSameDay(date, selectedDate)
            const label = getLabel(date)
            
            return (
              <button
                key={date.toISOString()}
                data-selected={isSelected}
                onClick={() => handleDateClick(date)}
                className={`snap-center flex-shrink-0 min-w-[80px] h-[50px] rounded-xl border flex items-center justify-center text-sm font-semibold transition-all
                  ${isSelected 
                    ? "border-lime-400 text-lime-400 bg-lime-400/5 shadow-[0_0_15px_rgba(163,230,53,0.15)]" 
                    : "border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/50"
                  }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        <button 
          onClick={() => scroll("right")}
          className="p-2 text-zinc-400 hover:text-white transition-colors"
          aria-label="Siguiente"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </div>
  )
}
