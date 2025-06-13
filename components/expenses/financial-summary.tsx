"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, CheckCircle } from "lucide-react"

interface FinancialSummaryProps {
  totalIncome: number
  totalExpenses: number
  balance: number
  salesIncome: number
  totalOtherIncome: number
  inventoryInvestment: number
  manualExpenses: number
  expensesByCategory: { [key: string]: number }
  budgetComparison: { [key: string]: { spent: number; budget: number; percentage: number } }
}

export function FinancialSummary({
  totalIncome,
  totalExpenses,
  balance,
  salesIncome,
  totalOtherIncome,
  inventoryInvestment,
  manualExpenses,
  expensesByCategory,
  budgetComparison,
}: FinancialSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
    }).format(amount)
  }

  const isPositiveBalance = balance >= 0
  const expensePercentage = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0

  const overBudgetCategories = Object.entries(budgetComparison).filter(([_, data]) => data.percentage > 100)

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Balance General */}
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Resumen Financiero
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">Ingresos Totales</span>
              </div>
              <div className="text-2xl font-bold text-green-700">{formatCurrency(totalIncome)}</div>
              <div className="text-xs text-green-600 mt-1">
                Ventas: {formatCurrency(salesIncome)} + Otros: {formatCurrency(totalOtherIncome)}
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-600">Gastos Totales</span>
              </div>
              <div className="text-2xl font-bold text-red-700">{formatCurrency(totalExpenses)}</div>
              <div className="text-xs text-red-600 mt-1">
                Materiales: {formatCurrency(inventoryInvestment)} + Otros: {formatCurrency(manualExpenses)}
              </div>
            </div>

            <div className={`p-4 rounded-lg ${isPositiveBalance ? "bg-blue-50" : "bg-orange-50"}`}>
              <div className="flex items-center gap-2 mb-2">
                {isPositiveBalance ? (
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                )}
                <span className={`text-sm font-medium ${isPositiveBalance ? "text-blue-600" : "text-orange-600"}`}>
                  Balance Disponible
                </span>
              </div>
              <div className={`text-2xl font-bold ${isPositiveBalance ? "text-blue-700" : "text-orange-700"}`}>
                {formatCurrency(Math.abs(balance))}
              </div>
              <div className={`text-xs mt-1 ${isPositiveBalance ? "text-blue-600" : "text-orange-600"}`}>
                {isPositiveBalance ? "Dinero disponible" : "Déficit"}
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-600">Eficiencia</span>
              </div>
              <div className="text-2xl font-bold text-purple-700">{expensePercentage.toFixed(1)}%</div>
              <div className="text-xs text-purple-600 mt-1">Gastos vs Ingresos</div>
            </div>
          </div>

          {/* Barra de progreso general */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Gastos vs Ingresos</span>
              <span>{expensePercentage.toFixed(1)}%</span>
            </div>
            <Progress
              value={Math.min(expensePercentage, 100)}
              className={`h-3 ${expensePercentage > 90 ? "bg-red-100" : expensePercentage > 70 ? "bg-yellow-100" : "bg-green-100"}`}
            />
          </div>
        </CardContent>
      </Card>

      {/* Alertas de Presupuesto */}
      {overBudgetCategories.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Alertas de Presupuesto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overBudgetCategories.map(([categoryName, data]) => (
                <div key={categoryName} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{categoryName}</span>
                  <Badge variant="destructive">+{(data.percentage - 100).toFixed(1)}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Distribución de Gastos */}
      <Card className={overBudgetCategories.length > 0 ? "md:col-span-2" : "md:col-span-1"}>
        <CardHeader>
          <CardTitle>Distribución de Gastos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(expensesByCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([categoryName, amount]) => {
                const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
                return (
                  <div key={categoryName} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{categoryName}</span>
                      <span>
                        {formatCurrency(amount)} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
