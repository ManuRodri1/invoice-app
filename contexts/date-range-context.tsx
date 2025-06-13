"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { startOfMonth, endOfMonth } from "date-fns"

export interface DateRange {
  from: Date
  to: Date
}

interface DateRangeContextType {
  dateRange: DateRange
  setDateRange: (range: DateRange) => void
  isFiltered: boolean
  resetDateRange: () => void
}

const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined)

export function useDateRange() {
  const context = useContext(DateRangeContext)
  if (context === undefined) {
    throw new Error("useDateRange must be used within a DateRangeProvider")
  }
  return context
}

interface DateRangeProviderProps {
  children: ReactNode
}

export function DateRangeProvider({ children }: DateRangeProviderProps) {
  // Rango por defecto: mes actual
  const defaultRange: DateRange = {
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  }

  const [dateRange, setDateRange] = useState<DateRange>(defaultRange)
  const [isFiltered, setIsFiltered] = useState(false)

  const handleSetDateRange = (range: DateRange) => {
    setDateRange(range)
    setIsFiltered(true)
  }

  const resetDateRange = () => {
    setDateRange(defaultRange)
    setIsFiltered(false)
  }

  return (
    <DateRangeContext.Provider
      value={{
        dateRange,
        setDateRange: handleSetDateRange,
        isFiltered,
        resetDateRange,
      }}
    >
      {children}
    </DateRangeContext.Provider>
  )
}
