"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Download } from "lucide-react"
import { CategoryManagement } from "@/components/expenses/category-management"
import { IncomeManagement } from "@/components/expenses/income-management"
import { ExpenseManagement } from "@/components/expenses/expense-management"
import { FinancialSummary } from "@/components/expenses/financial-summary"
import { DataValidationAlert } from "@/components/expenses/data-validation-alert"
import { ExpenseService } from "@/lib/expense-service"
import type { ExpenseCategory, Expense, IncomeSource, InventoryMovementDisplay } from "@/lib/types"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default function GastosPage() {
  const [viewType, setViewType] = useState<"monthly" | "yearly">("monthly")
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })
  const [selectedYear, setSelectedYear] = useState(() => {
    const now = new Date()
    return now.getFullYear().toString()
  })

  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([])
  const [salesIncome, setSalesIncome] = useState(0)
  const [inventoryInvestment, setInventoryInvestment] = useState(0)
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovementDisplay[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDataConsistent, setIsDataConsistent] = useState(true)

  // Función para obtener el período actual para mostrar en labels - CORREGIDA
  const getCurrentPeriodLabel = () => {
    if (viewType === "monthly" && selectedMonth) {
      try {
        // Crear fecha correctamente usando el mes seleccionado
        const [year, month] = selectedMonth.split("-")
        const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, 1) // month - 1 porque Date usa 0-based months
        return format(date, "MMMM yyyy", { locale: es })
      } catch (error) {
        console.error("Error formatting month:", error)
        return selectedMonth
      }
    } else if (viewType === "yearly" && selectedYear) {
      return `Año ${selectedYear}`
    }
    return "Período actual"
  }

  // Función para obtener el período en formato corto para títulos
  const getCurrentPeriodShort = () => {
    if (viewType === "monthly" && selectedMonth) {
      try {
        const [year, month] = selectedMonth.split("-")
        const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, 1)
        return format(date, "MMM yyyy", { locale: es })
      } catch (error) {
        console.error("Error formatting month:", error)
        return selectedMonth
      }
    } else if (viewType === "yearly" && selectedYear) {
      return selectedYear
    }
    return "Período actual"
  }

  useEffect(() => {
    console.log(`🔄 Cambio detectado - Tipo: ${viewType}, Mes: ${selectedMonth}, Año: ${selectedYear}`)
    loadAllData()
  }, [selectedMonth, selectedYear, viewType])

  const loadAllData = async () => {
    setIsLoading(true)
    try {
      const currentPeriod = getCurrentPeriodLabel()
      console.log(`📊 Cargando datos para: ${currentPeriod}`)

      // Determinar parámetros según el tipo de vista
      const monthParam = viewType === "monthly" ? selectedMonth : undefined
      const yearParam = viewType === "yearly" ? selectedYear : undefined

      console.log(`🔍 Parámetros de consulta:`, { monthParam, yearParam, viewType })

      // Cargar datos principales
      const [categoriesData, expensesData, incomeData, salesData, inventoryData] = await Promise.all([
        ExpenseService.getCategories(),
        ExpenseService.getExpenses(monthParam, yearParam),
        ExpenseService.getIncomeSources(monthParam, yearParam),
        ExpenseService.getSalesIncome(monthParam, yearParam),
        ExpenseService.getInventoryInvestment(monthParam, yearParam),
      ])

      // Cargar movimientos de inventario por separado para manejar errores
      let movementsData: InventoryMovementDisplay[] = []
      try {
        movementsData = await ExpenseService.getInventoryMovements(monthParam, yearParam)
      } catch (movementError) {
        console.error("❌ Error cargando movimientos de inventario:", movementError)
        // Continuar sin los movimientos si hay error
      }

      setCategories(categoriesData)
      setExpenses(expensesData)
      setIncomeSources(incomeData)
      setSalesIncome(salesData)
      setInventoryInvestment(inventoryData)
      setInventoryMovements(movementsData)

      console.log(`✅ Datos cargados para ${currentPeriod}:`, {
        categorias: categoriesData.length,
        gastos: expensesData.length,
        ingresos: incomeData.length,
        ventas: salesData,
        materiales: inventoryData,
        movimientos: movementsData.length,
      })
    } catch (error) {
      console.error("❌ Error al cargar datos:", error)
      toast.error("Error al cargar datos")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDataChange = () => {
    console.log("🔄 Recargando datos por cambio...")
    loadAllData()
  }

  const handleValidationComplete = (isValid: boolean) => {
    setIsDataConsistent(isValid)
  }

  // Calcular resumen financiero
  const financialSummary = ExpenseService.calculateFinancialSummary(
    expenses,
    incomeSources,
    categories,
    salesIncome,
    inventoryInvestment,
  )

  // Generar opciones de meses (últimos 12 meses + próximos 3)
  const generateMonthOptions = () => {
    const options = []
    const now = new Date()

    for (let i = -12; i <= 3; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      const label = format(date, "MMMM yyyy", { locale: es })
      options.push({ value, label })
    }

    return options
  }

  // Generar opciones de años (últimos 5 años + próximos 2)
  const generateYearOptions = () => {
    const options = []
    const currentYear = new Date().getFullYear()

    for (let i = -5; i <= 2; i++) {
      const year = currentYear + i
      options.push({ value: year.toString(), label: year.toString() })
    }

    return options
  }

  const monthOptions = generateMonthOptions()
  const yearOptions = generateYearOptions()

  const exportToExcel = () => {
    // Implementar exportación a Excel
    toast.info("Función de exportación en desarrollo")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando datos financieros...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Control de Gastos</h1>
          <p className="text-muted-foreground">
            Gestiona tus ingresos, gastos y presupuestos - {getCurrentPeriodLabel()}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {/* Selector de tipo de vista */}
          <Select value={viewType} onValueChange={(value: "monthly" | "yearly") => setViewType(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Mensual</SelectItem>
              <SelectItem value="yearly">Anual</SelectItem>
            </SelectContent>
          </Select>

          {/* Selector de período */}
          {viewType === "monthly" ? (
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48">
                <CalendarIcon className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32">
                <CalendarIcon className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button variant="outline" onClick={exportToExcel}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Validación Automática */}
      <DataValidationAlert
        selectedMonth={viewType === "monthly" ? selectedMonth : undefined}
        selectedYear={viewType === "yearly" ? selectedYear : undefined}
        onValidationComplete={handleValidationComplete}
      />

      {/* Resumen Financiero */}
      <FinancialSummary
        totalIncome={financialSummary.totalIncome}
        totalExpenses={financialSummary.totalExpenses}
        balance={financialSummary.balance}
        salesIncome={financialSummary.salesIncome}
        totalOtherIncome={financialSummary.totalOtherIncome}
        inventoryInvestment={financialSummary.inventoryInvestment}
        manualExpenses={financialSummary.manualExpenses}
        expensesByCategory={financialSummary.expensesByCategory}
        budgetComparison={financialSummary.budgetComparison}
      />

      {/* Gestión de Ingresos */}
      <IncomeManagement
        selectedMonth={viewType === "monthly" ? selectedMonth : undefined}
        selectedYear={viewType === "yearly" ? selectedYear : undefined}
        salesIncome={salesIncome}
        onIncomeChange={handleDataChange}
      />

      {/* Gestión de Categorías */}
      <CategoryManagement
        onCategoriesChange={handleDataChange}
        budgetComparison={financialSummary.budgetComparison}
        inventoryInvestment={inventoryInvestment}
      />

      {/* Gestión de Gastos */}
      <ExpenseManagement
        selectedMonth={viewType === "monthly" ? selectedMonth : undefined}
        selectedYear={viewType === "yearly" ? selectedYear : undefined}
        categories={categories}
        viewType={viewType}
        onExpenseChange={handleDataChange}
      />

      {/* Historial de Movimientos de Inventario */}
      {inventoryMovements.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Historial de Entradas de Inventario - {getCurrentPeriodLabel()}</h2>
          <p className="text-muted-foreground">
            Movimientos de entrada registrados con fecha dentro del período seleccionado
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-300 bg-white rounded-lg">
              <thead className="bg-slate-50">
                <tr>
                  <th className="border border-slate-300 p-3 text-left font-semibold">Producto</th>
                  <th className="border border-slate-300 p-3 text-left font-semibold">Cantidad</th>
                  <th className="border border-slate-300 p-3 text-left font-semibold">Costo Total</th>
                  <th className="border border-slate-300 p-3 text-left font-semibold">Fecha de Entrada</th>
                  <th className="border border-slate-300 p-3 text-left font-semibold">Usuario</th>
                </tr>
              </thead>
              <tbody>
                {inventoryMovements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 p-3">{movement.product}</td>
                    <td className="border border-slate-300 p-3">{movement.quantity}</td>
                    <td className="border border-slate-300 p-3">${movement.investmentCost.toFixed(2)}</td>
                    <td className="border border-slate-300 p-3">
                      {format(new Date(movement.entryDate), "dd/MM/yyyy", { locale: es })}
                    </td>
                    <td className="border border-slate-300 p-3">{movement.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-sm text-muted-foreground">
            Total de entradas: {inventoryMovements.length} | Inversión total: $
            {inventoryMovements.reduce((sum, m) => sum + m.investmentCost, 0).toFixed(2)}
          </div>
        </div>
      )}

      {inventoryMovements.length === 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Historial de Entradas de Inventario - {getCurrentPeriodLabel()}</h2>
          <div className="text-center py-8 text-muted-foreground">
            <p>No hay movimientos de entrada registrados para este período.</p>
            <p className="text-sm mt-2">
              Los movimientos aparecerán aquí cuando se registren entradas con fecha dentro del rango seleccionado.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
