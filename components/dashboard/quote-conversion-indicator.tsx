"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { useDateRange } from "@/contexts/date-range-context"
import { supabase } from "@/lib/supabase/client"

interface QuoteConversionIndicatorProps {
  conversionRate: number
}

export function QuoteConversionIndicator({ conversionRate: initialConversionRate }: QuoteConversionIndicatorProps) {
  const { dateRange } = useDateRange()
  const [conversionRate, setConversionRate] = useState(initialConversionRate)

  // Update conversion rate based on date filter
  useEffect(() => {
    async function updateConversionData() {
      if (!dateRange.from || !dateRange.to) {
        setConversionRate(initialConversionRate)
        return
      }

      try {
        const { data: quotes } = await supabase
          .from("quotes")
          .select("status")
          .gte("created_at", dateRange.from.toISOString())
          .lte("created_at", dateRange.to.toISOString())

        const totalQuotes = quotes?.length || 0
        const convertedQuotes = quotes?.filter((quote) => quote.status === "Convertida").length || 0
        const newConversionRate = totalQuotes > 0 ? (convertedQuotes / totalQuotes) * 100 : 0

        setConversionRate(newConversionRate)
      } catch (error) {
        console.error("Error updating conversion data:", error)
        setConversionRate(initialConversionRate)
      }
    }

    updateConversionData()
  }, [dateRange, initialConversionRate])

  // Determinar el color basado en la tasa de conversión
  const getColorClass = () => {
    if (conversionRate >= 70) return "bg-green-500"
    if (conversionRate >= 40) return "bg-yellow-500"
    return "bg-red-500"
  }

  // Mensaje basado en la tasa de conversión
  const getMessage = () => {
    if (conversionRate >= 70) return "¡Excelente tasa de conversión!"
    if (conversionRate >= 40) return "Tasa de conversión aceptable"
    return "Tasa de conversión baja, considere mejorar el seguimiento"
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <span className="text-2xl font-bold">{conversionRate.toFixed(1)}%</span>
        <span className="text-sm text-muted-foreground text-center sm:text-right">{getMessage()}</span>
      </div>

      <Progress value={conversionRate} className="h-2" indicatorClassName={getColorClass()} />

      <div className="grid grid-cols-3 text-center text-sm">
        <div>
          <div className="font-medium">Bajo</div>
          <div className="text-xs text-muted-foreground">&lt;40%</div>
        </div>
        <div>
          <div className="font-medium">Medio</div>
          <div className="text-xs text-muted-foreground">40-70%</div>
        </div>
        <div>
          <div className="font-medium">Alto</div>
          <div className="text-xs text-muted-foreground">&gt;70%</div>
        </div>
      </div>
    </div>
  )
}
