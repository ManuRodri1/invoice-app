"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Settings, TrendingUp, Target } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useSalesGoal } from "@/hooks/use-sales-goal"
import { useDateRange } from "@/contexts/date-range-context"
import { supabase } from "@/lib/supabase/client"

interface SalesGoalCardProps {
  currentSales: number
  previousMonthSales?: number
}

export function SalesGoalCard({ currentSales: initialCurrentSales, previousMonthSales = 0 }: SalesGoalCardProps) {
  const { dateRange } = useDateRange()
  const [currentSales, setCurrentSales] = useState(initialCurrentSales)
  const { goalAmount, progressPercentage, isManuallySet, updateGoal } = useSalesGoal(currentSales, previousMonthSales)
  const [tempGoalAmount, setTempGoalAmount] = useState(goalAmount.toString())
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Update sales based on date filter
  useEffect(() => {
    async function updateSalesData() {
      if (!dateRange.from || !dateRange.to) {
        setCurrentSales(initialCurrentSales)
        return
      }

      try {
        const { data: invoices } = await supabase
          .from("invoices")
          .select("total_amount")
          .gte("created_at", dateRange.from.toISOString())
          .lte("created_at", dateRange.to.toISOString())

        const filteredSales = invoices?.reduce((sum, invoice) => sum + invoice.total_amount, 0) || 0
        setCurrentSales(filteredSales)
      } catch (error) {
        console.error("Error updating sales data:", error)
        setCurrentSales(initialCurrentSales)
      }
    }

    updateSalesData()
  }, [dateRange, initialCurrentSales])

  // Determinar el color basado en el progreso
  const getColorClass = () => {
    if (progressPercentage >= 90) return "bg-green-500"
    if (progressPercentage >= 60) return "bg-yellow-500"
    return "bg-red-500"
  }

  const handleSaveGoal = () => {
    const newGoal = Number.parseFloat(tempGoalAmount)
    if (!isNaN(newGoal) && newGoal > 0) {
      updateGoal(newGoal, true)
      setIsDialogOpen(false)
    }
  }

  const handleDialogOpen = (open: boolean) => {
    if (open) {
      setTempGoalAmount(goalAmount.toString())
    }
    setIsDialogOpen(open)
  }

  const getGoalTypeIndicator = () => {
    if (isManuallySet) {
      return (
        <div className="flex items-center gap-1 text-xs text-blue-600">
          <Target className="h-3 w-3" />
          <span className="hidden sm:inline">Meta personalizada</span>
          <span className="sm:hidden">Personalizada</span>
        </div>
      )
    } else {
      return (
        <div className="flex items-center gap-1 text-xs text-green-600">
          <TrendingUp className="h-3 w-3" />
          <span className="hidden sm:inline">Meta automática (+10% mes anterior)</span>
          <span className="sm:hidden">Automática</span>
        </div>
      )
    }
  }

  return (
    <div className="space-y-4">
      {/* Encabezado responsivo */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <div className="text-sm text-muted-foreground">Ventas actuales</div>
          <div className="text-xl sm:text-2xl font-bold break-all">{formatCurrency(currentSales)}</div>
        </div>
        <div className="flex items-start gap-2">
          <div className="text-right flex-1">
            <div className="text-sm text-muted-foreground">Meta mensual</div>
            <div className="text-xl sm:text-2xl font-bold break-all">{formatCurrency(goalAmount)}</div>
            <div className="mt-1">{getGoalTypeIndicator()}</div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="flex-shrink-0">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-md">
              <DialogHeader>
                <DialogTitle>Configurar Meta de Ventas</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="goal-amount" className="text-sm font-medium">
                    Meta mensual (RD$)
                  </label>
                  <Input
                    id="goal-amount"
                    value={tempGoalAmount}
                    onChange={(e) => setTempGoalAmount(e.target.value)}
                    type="number"
                    min="0"
                    step="1000"
                  />
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Meta actual: {formatCurrency(goalAmount)}</div>
                    {previousMonthSales > 0 && <div>Ventas mes anterior: {formatCurrency(previousMonthSales)}</div>}
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg text-sm">
                  <p className="font-medium text-blue-900">💡 Información:</p>
                  <p className="text-blue-700 mt-1">
                    Si estableces una meta manualmente, se mantendrá hasta que la cambies. Si no, se calculará
                    automáticamente cada mes (+10% del mes anterior).
                  </p>
                </div>
                <Button onClick={handleSaveGoal} className="w-full">
                  Guardar Meta Personalizada
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progreso</span>
          <span className="font-medium">{progressPercentage.toFixed(1)}%</span>
        </div>
        <Progress value={progressPercentage} className="h-3 sm:h-2" indicatorClassName={getColorClass()} />
      </div>

      {/* Estado del progreso */}
      <div className="text-sm text-muted-foreground">
        {progressPercentage >= 100 ? (
          <span className="text-green-500 font-medium">¡Meta alcanzada! 🎉</span>
        ) : (
          <div className="break-all">Faltan {formatCurrency(goalAmount - currentSales)} para alcanzar la meta</div>
        )}
      </div>

      {/* Comparativa con mes anterior */}
      {previousMonthSales > 0 && (
        <div className="text-xs text-muted-foreground border-t pt-2 space-y-1">
          <div className="flex justify-between">
            <span>Mes anterior:</span>
            <span className="break-all">{formatCurrency(previousMonthSales)}</span>
          </div>
          <div className="flex justify-between">
            <span>Crecimiento:</span>
            <span className={currentSales > previousMonthSales ? "text-green-600" : "text-red-600"}>
              {(((currentSales - previousMonthSales) / previousMonthSales) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
