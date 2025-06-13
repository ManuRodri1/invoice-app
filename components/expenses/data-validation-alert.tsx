"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, RefreshCw } from "lucide-react"
import { ExpenseService } from "@/lib/expense-service"
import { Button } from "@/components/ui/button"

interface DataValidationAlertProps {
  selectedMonth?: string
  selectedYear?: string
  onValidationComplete?: (isValid: boolean) => void
}

export function DataValidationAlert({ selectedMonth, selectedYear, onValidationComplete }: DataValidationAlertProps) {
  const [validationResult, setValidationResult] = useState<{
    isConsistent: boolean
    salesDifference: number
    investmentDifference: number
    financeData: { sales: number; investment: number }
    expenseData: { sales: number; investment: number }
  } | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  const validateData = async () => {
    setIsValidating(true)
    try {
      const result = await ExpenseService.validateDataConsistency(selectedMonth, selectedYear)
      setValidationResult(result)
      onValidationComplete?.(result.isConsistent)
    } catch (error) {
      console.error("Error validating data:", error)
      onValidationComplete?.(false)
    } finally {
      setIsValidating(false)
    }
  }

  useEffect(() => {
    if (selectedMonth || selectedYear) {
      validateData()
    }
  }, [selectedMonth, selectedYear])

  if (!validationResult) {
    return (
      <Alert>
        <RefreshCw className="h-4 w-4 animate-spin" />
        <AlertDescription>Validando consistencia de datos...</AlertDescription>
      </Alert>
    )
  }

  const { isConsistent, salesDifference, investmentDifference, financeData, expenseData } = validationResult

  if (isConsistent) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <div className="flex items-center justify-between">
            <span>Los datos están sincronizados correctamente entre módulos.</span>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Validado
            </Badge>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="border-yellow-200 bg-yellow-50">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-yellow-800">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium">Se detectaron inconsistencias en los datos:</span>
            <Button variant="outline" size="sm" onClick={validateData} disabled={isValidating}>
              {isValidating ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : null}
              Revalidar
            </Button>
          </div>

          {salesDifference > 0.01 && (
            <div className="text-sm">
              <strong>Ventas:</strong> Finanzas: ${financeData.sales.toFixed(2)} | Control de Gastos: $
              {expenseData.sales.toFixed(2)} (Diferencia: ${salesDifference.toFixed(2)})
            </div>
          )}

          {investmentDifference > 0.01 && (
            <div className="text-sm">
              <strong>Materiales:</strong> Finanzas: ${financeData.investment.toFixed(2)} | Control de Gastos: $
              {expenseData.investment.toFixed(2)} (Diferencia: ${investmentDifference.toFixed(2)})
            </div>
          )}

          <div className="text-xs text-yellow-700">
            Los datos se están calculando automáticamente desde el inventario. Las diferencias pueden deberse a
            registros manuales duplicados.
          </div>
        </div>
      </AlertDescription>
    </Alert>
  )
}
