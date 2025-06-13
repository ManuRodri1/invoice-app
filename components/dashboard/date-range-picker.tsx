"use client"

import { useState } from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useDateRange, type DateRange } from "@/contexts/date-range-context"

export function DateRangePicker() {
  const { dateRange, setDateRange, resetDateRange, isFiltered } = useDateRange()
  const [tempRange, setTempRange] = useState<DateRange>(dateRange)
  const [isOpen, setIsOpen] = useState(false)

  const handleApply = () => {
    setDateRange(tempRange)
    setIsOpen(false)
  }

  const handleReset = () => {
    resetDateRange()
    setTempRange({
      from: new Date(),
      to: new Date(),
    })
    setIsOpen(false)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-full sm:w-[300px] justify-start text-left font-normal",
              !dateRange && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "LLL dd, y", { locale: es })} -{" "}
                  {format(dateRange.to, "LLL dd, y", { locale: es })}
                </>
              ) : (
                format(dateRange.from, "LLL dd, y", { locale: es })
              )
            ) : (
              <span>Seleccionar rango de fechas</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={tempRange?.from}
            selected={{
              from: tempRange?.from,
              to: tempRange?.to,
            }}
            onSelect={(range) => {
              if (range?.from && range?.to) {
                setTempRange({
                  from: range.from,
                  to: range.to,
                })
              }
            }}
            numberOfMonths={2}
            locale={es}
          />
          <div className="flex gap-2 p-3 border-t">
            <Button onClick={handleApply} size="sm" className="flex-1">
              Aplicar
            </Button>
            <Button onClick={handleReset} variant="outline" size="sm" className="flex-1">
              Resetear
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {isFiltered && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtro activo:</span>
          <Button onClick={handleReset} variant="outline" size="sm">
            Limpiar filtro
          </Button>
        </div>
      )}
    </div>
  )
}
