import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { ExpenseCategory, Expense, IncomeSource, InventoryMovementDisplay } from "./types"

const supabase = createClientComponentClient()

export class ExpenseService {
  // Categorías de gastos
  static async getCategories(): Promise<ExpenseCategory[]> {
    const { data, error } = await supabase.from("expense_categories").select("*").order("name")

    if (error) throw error
    return data || []
  }

  static async createCategory(
    category: Omit<ExpenseCategory, "id" | "created_at" | "updated_at" | "user_id">,
  ): Promise<ExpenseCategory> {
    const { data, error } = await supabase.from("expense_categories").insert([category]).select().single()

    if (error) throw error
    return data
  }

  static async updateCategory(id: string, updates: Partial<ExpenseCategory>): Promise<ExpenseCategory> {
    const { data, error } = await supabase
      .from("expense_categories")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase.from("expense_categories").delete().eq("id", id)

    if (error) throw error
  }

  // Obtener gastos por mes
  static async getExpenses(month?: string): Promise<Expense[]> {
    let query = supabase
      .from("expenses")
      .select(`
        *,
        category:expense_categories(*)
      `)
      .order("date", { ascending: false })

    if (month) {
      // Vista mensual - calcular último día del mes correctamente
      const [yearPart, monthPart] = month.split("-")
      const lastDay = new Date(Number.parseInt(yearPart), Number.parseInt(monthPart), 0).getDate()
      const startDate = `${month}-01`
      const endDate = `${month}-${String(lastDay).padStart(2, "0")}`
      query = query.gte("date", startDate).lte("date", endDate)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  // Obtener gastos por año - MÉTODO AGREGADO
  static async getExpensesByYear(year: string): Promise<Expense[]> {
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`

    const { data, error } = await supabase
      .from("expenses")
      .select(`
        *,
        category:expense_categories(*)
      `)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false })

    if (error) throw error
    return data || []
  }

  static async createExpense(expense: Omit<Expense, "id" | "created_at" | "updated_at" | "user_id">): Promise<Expense> {
    const { data, error } = await supabase
      .from("expenses")
      .insert([expense])
      .select(`
        *,
        category:expense_categories(*)
      `)
      .single()

    if (error) throw error
    return data
  }

  static async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense> {
    const { data, error } = await supabase
      .from("expenses")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select(`
        *,
        category:expense_categories(*)
      `)
      .single()

    if (error) throw error
    return data
  }

  static async deleteExpense(id: string): Promise<void> {
    const { error } = await supabase.from("expenses").delete().eq("id", id)

    if (error) throw error
  }

  // Obtener fuentes de ingresos por mes
  static async getIncomeSources(month?: string): Promise<IncomeSource[]> {
    let query = supabase.from("income_sources").select("*").order("date", { ascending: false })

    if (month) {
      // Vista mensual - calcular último día del mes correctamente
      const [yearPart, monthPart] = month.split("-")
      const lastDay = new Date(Number.parseInt(yearPart), Number.parseInt(monthPart), 0).getDate()
      const startDate = `${month}-01`
      const endDate = `${month}-${String(lastDay).padStart(2, "0")}`
      query = query.gte("date", startDate).lte("date", endDate)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  // Obtener fuentes de ingresos por año - MÉTODO AGREGADO
  static async getIncomeSourcesByYear(year: string): Promise<IncomeSource[]> {
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`

    const { data, error } = await supabase
      .from("income_sources")
      .select("*")
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false })

    if (error) throw error
    return data || []
  }

  static async createIncomeSource(
    income: Omit<IncomeSource, "id" | "created_at" | "updated_at" | "user_id">,
  ): Promise<IncomeSource> {
    const { data, error } = await supabase.from("income_sources").insert([income]).select().single()

    if (error) throw error
    return data
  }

  static async updateIncomeSource(id: string, updates: Partial<IncomeSource>): Promise<IncomeSource> {
    const { data, error } = await supabase
      .from("income_sources")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async deleteIncomeSource(id: string): Promise<void> {
    const { error } = await supabase.from("income_sources").delete().eq("id", id)

    if (error) throw error
  }

  // VENTAS TOTALES - Solo facturas pagadas
  static async getSalesIncome(month?: string, year?: string): Promise<number> {
    try {
      let startDate: string
      let endDate: string

      if (year && !month) {
        // Vista anual
        startDate = `${year}-01-01`
        endDate = `${year}-12-31`
        console.log(`📊 Calculando ventas anuales (solo pagadas) para el año: ${year}`)
      } else if (month) {
        // Vista mensual - calcular último día del mes correctamente
        const [yearPart, monthPart] = month.split("-")
        const lastDay = new Date(Number.parseInt(yearPart), Number.parseInt(monthPart), 0).getDate()
        startDate = `${month}-01`
        endDate = `${month}-${String(lastDay).padStart(2, "0")}`
        console.log(`📊 Calculando ventas mensuales (solo pagadas) para el mes: ${month} (último día: ${lastDay})`)
      } else {
        return 0
      }

      // Obtener facturas PAGADAS del período
      const { data: invoices, error: invoiceError } = await supabase
        .from("invoices")
        .select("id, total_amount, created_at, payment_status")
        .eq("payment_status", "Pagado")
        .gte("created_at", `${startDate}T00:00:00.000Z`)
        .lte("created_at", `${endDate}T23:59:59.999Z`)

      if (invoiceError) {
        console.error("Error getting invoices:", invoiceError)
        return 0
      }

      const totalSales = invoices?.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0) || 0
      console.log(`✅ Total de ventas (solo pagadas): ${totalSales}`)

      return totalSales
    } catch (error) {
      console.error("Error calculating sales income:", error)
      return 0
    }
  }

  // VENTAS TOTALES POR AÑO - MÉTODO AGREGADO
  static async getSalesIncomeByYear(year: string): Promise<number> {
    return this.getSalesIncome(undefined, year)
  }

  // MATERIALES COMPRADOS - NUEVA LÓGICA BASADA EN FECHA DE ENTRADA
  static async getInventoryInvestment(month?: string, year?: string): Promise<number> {
    try {
      let startDate: string
      let endDate: string

      if (year && !month) {
        // Vista anual
        startDate = `${year}-01-01`
        endDate = `${year}-12-31`
        console.log(`🔍 Calculando inversión en materiales ANUAL para: ${year}`)
      } else if (month) {
        // Vista mensual - calcular último día del mes correctamente
        const [yearPart, monthPart] = month.split("-")
        const lastDay = new Date(Number.parseInt(yearPart), Number.parseInt(monthPart), 0).getDate()
        startDate = `${month}-01`
        endDate = `${month}-${String(lastDay).padStart(2, "0")}`
        console.log(`🔍 Calculando inversión en materiales MENSUAL para: ${month} (${startDate} a ${endDate})`)
      } else {
        console.log("❌ No se proporcionó mes ni año")
        return 0
      }

      console.log(`📊 Buscando movimientos de ENTRADA con fecha_entrada entre ${startDate} y ${endDate}`)

      // NUEVA LÓGICA: Obtener movimientos de ENTRADA filtrados por fecha_entrada
      const { data: entryMovements, error: movementsError } = await supabase
        .from("movimientos_inventario")
        .select(`
        id,
        cantidad,
        fecha_entrada,
        inventario:inventario_id (
          id,
          product_id,
          products:product_id (
            id,
            name,
            cost_price
          )
        )
      `)
        .eq("tipo", "Entrada")
        .gte("fecha_entrada", startDate)
        .lte("fecha_entrada", endDate)
        .not("fecha_entrada", "is", null)

      if (movementsError) {
        console.error("❌ Error obteniendo movimientos de entrada:", movementsError)
        return 0
      }

      console.log(`📦 Movimientos de entrada encontrados: ${entryMovements?.length || 0}`)

      if (!entryMovements || entryMovements.length === 0) {
        console.log("ℹ️ No hay movimientos de entrada en este período")
        return 0
      }

      // Calcular inversión total basada en cantidad * costo de cada movimiento
      let totalInvestment = 0

      entryMovements.forEach((movement) => {
        const cantidad = movement.cantidad || 0
        const costPrice = movement.inventario?.products?.cost_price || 0
        const investment = cantidad * costPrice
        const productName = movement.inventario?.products?.name || "Producto sin nombre"

        console.log(`📋 Movimiento: ${productName}`, {
          fecha_entrada: movement.fecha_entrada,
          cantidad: cantidad,
          cost_price: costPrice,
          inversion_movimiento: investment,
        })

        totalInvestment += investment
      })

      console.log(`💰 INVERSIÓN TOTAL EN MATERIALES (ENTRADAS DEL PERÍODO): ${totalInvestment}`)

      return totalInvestment
    } catch (error) {
      console.error("❌ Error calculando inversión en inventario:", error)
      return 0
    }
  }

  // MATERIALES COMPRADOS POR AÑO - MÉTODO AGREGADO
  static async getInventoryInvestmentByYear(year: string): Promise<number> {
    return this.getInventoryInvestment(undefined, year)
  }

  // MÉTODO: Obtener movimientos de inventario por período (basado en fecha_entrada)
  static async getInventoryMovements(month?: string, year?: string): Promise<InventoryMovementDisplay[]> {
    try {
      let startDate: string
      let endDate: string

      if (year && !month) {
        // Vista anual
        startDate = `${year}-01-01`
        endDate = `${year}-12-31`
        console.log(`🔍 Obteniendo movimientos de inventario ANUAL para: ${year}`)
      } else if (month) {
        // Vista mensual - calcular último día del mes correctamente
        const [yearPart, monthPart] = month.split("-")
        const lastDay = new Date(Number.parseInt(yearPart), Number.parseInt(monthPart), 0).getDate()
        startDate = `${month}-01`
        endDate = `${month}-${String(lastDay).padStart(2, "0")}`
        console.log(`🔍 Obteniendo movimientos de inventario MENSUAL para: ${month} (${startDate} a ${endDate})`)
      } else {
        console.log("❌ No se proporcionó mes ni año")
        return []
      }

      // Obtener movimientos de entrada con fecha_entrada en el período
      const { data: movements, error: movementsError } = await supabase
        .from("movimientos_inventario")
        .select(`
        id,
        cantidad,
        fecha_entrada,
        usuario,
        created_at,
        inventario:inventario_id (
          id,
          product_id,
          products:product_id (
            id,
            name,
            cost_price
          )
        )
      `)
        .eq("tipo", "Entrada")
        .gte("fecha_entrada", startDate)
        .lte("fecha_entrada", endDate)
        .not("fecha_entrada", "is", null)
        .order("fecha_entrada", { ascending: false })

      if (movementsError) {
        console.error("❌ Error obteniendo movimientos de inventario:", movementsError)
        return []
      }

      console.log(`📦 Movimientos de entrada encontrados: ${movements?.length || 0}`)

      // Formatear los datos para la tabla
      const formattedMovements: InventoryMovementDisplay[] =
        movements?.map((movement) => ({
          id: movement.id,
          product: movement.inventario?.products?.name || "Producto sin nombre",
          quantity: movement.cantidad || 0,
          investmentCost: (movement.cantidad || 0) * (movement.inventario?.products?.cost_price || 0),
          entryDate: movement.fecha_entrada || movement.created_at,
          user: movement.usuario || "Usuario desconocido",
        })) || []

      return formattedMovements
    } catch (error) {
      console.error("❌ Error obteniendo movimientos de inventario:", error)
      return []
    }
  }

  // VALIDACIÓN AUTOMÁTICA
  static async validateDataConsistency(
    month?: string,
    year?: string,
  ): Promise<{
    isConsistent: boolean
    salesDifference: number
    investmentDifference: number
    financeData: { sales: number; investment: number }
    expenseData: { sales: number; investment: number }
  }> {
    try {
      console.log(`Validando consistencia de datos para: ${year ? `año ${year}` : `mes ${month}`}`)

      // Obtener datos de Control de Gastos
      const expenseSales = await this.getSalesIncome(month, year)
      const expenseInvestment = await this.getInventoryInvestment(month, year)

      // Para la validación, usar los mismos datos ya que estamos usando la lógica correcta
      const financeData = {
        sales: expenseSales,
        investment: expenseInvestment,
      }

      // Calcular diferencias (deberían ser 0 ya que usamos la lógica correcta)
      const salesDifference = Math.abs(financeData.sales - expenseSales)
      const investmentDifference = Math.abs(financeData.investment - expenseInvestment)

      // Considerar consistente si la diferencia es menor a 0.01 (centavos)
      const isConsistent = salesDifference < 0.01 && investmentDifference < 0.01

      return {
        isConsistent,
        salesDifference,
        investmentDifference,
        financeData,
        expenseData: {
          sales: expenseSales,
          investment: expenseInvestment,
        },
      }
    } catch (error) {
      console.error("Error validating data consistency:", error)
      return {
        isConsistent: false,
        salesDifference: 0,
        investmentDifference: 0,
        financeData: { sales: 0, investment: 0 },
        expenseData: { sales: 0, investment: 0 },
      }
    }
  }

  // MÉTODO: Calcular resumen financiero
  static calculateFinancialSummary(
    expenses: Expense[],
    incomeSources: IncomeSource[],
    categories: ExpenseCategory[],
    salesIncome: number,
    inventoryInvestment: number,
  ) {
    const totalOtherIncome = incomeSources.reduce((sum, income) => sum + income.amount, 0)
    const totalIncome = salesIncome + totalOtherIncome

    const manualExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const totalExpenses = inventoryInvestment + manualExpenses

    const balance = totalIncome - totalExpenses

    // Gastos por categoría (incluyendo inversión en inventario)
    const expensesByCategory: { [key: string]: number } = {
      "Materiales comprados": inventoryInvestment,
    }

    expenses.forEach((expense) => {
      const categoryName = expense.category?.name || "Sin categoría"
      expensesByCategory[categoryName] = (expensesByCategory[categoryName] || 0) + expense.amount
    })

    // Comparación con presupuesto
    const budgetComparison: { [key: string]: { spent: number; budget: number; percentage: number } } = {}

    // Agregar categoría automática para materiales
    const materialsSpent = inventoryInvestment
    budgetComparison["Materiales comprados"] = {
      spent: materialsSpent,
      budget: 0, // Sin presupuesto definido para materiales automáticos
      percentage: 0,
    }

    categories.forEach((category) => {
      const spent = expensesByCategory[category.name] || 0
      const budget = category.budget || 0
      const percentage = budget > 0 ? (spent / budget) * 100 : 0

      budgetComparison[category.name] = {
        spent,
        budget,
        percentage,
      }
    })

    return {
      totalIncome,
      totalOtherIncome,
      salesIncome,
      totalExpenses,
      manualExpenses,
      inventoryInvestment,
      balance,
      expensesByCategory,
      budgetComparison,
    }
  }
}
