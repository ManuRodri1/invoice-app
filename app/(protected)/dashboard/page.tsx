import { createServerClient } from "@/lib/supabase/server"
import { DashboardCharts } from "@/components/dashboard/dashboard-charts"
import { MonthlyRevenueChart } from "@/components/dashboard/monthly-revenue-chart"
import { MonthlyProfitChart } from "@/components/dashboard/monthly-profit-chart"
import { InvoiceStatusChart } from "@/components/dashboard/invoice-status-chart"
import { QuoteConversionIndicator } from "@/components/dashboard/quote-conversion-indicator"
import { SalesGoalCard } from "@/components/dashboard/sales-goal-card"
import { DateRangePicker } from "@/components/dashboard/date-range-picker"

export default async function DashboardPage() {
  const supabase = createServerClient()

  // Obtener datos para los gráficos
  const { data: products } = await supabase.from("products").select("*")
  const { data: invoices } = await supabase.from("invoices").select("*")
  const { data: invoiceItems } = await supabase.from("invoice_items").select("*, product:products(*)")
  const { data: quotes } = await supabase.from("quotes").select("*")

  // Calcular estadísticas para los gráficos
  const totalSales = invoices?.reduce((acc, invoice) => acc + invoice.total_amount, 0) || 0
  const totalCost =
    invoiceItems?.reduce((acc, item) => {
      const costPrice = item.product?.cost_price || 0
      return acc + costPrice * item.quantity
    }, 0) || 0
  const totalProfit = totalSales - totalCost

  // Calcular conversión de cotizaciones
  const totalQuotes = quotes?.length || 0
  const convertedQuotes = quotes?.filter((quote) => quote.status === "Convertida").length || 0
  const conversionRate = totalQuotes > 0 ? (convertedQuotes / totalQuotes) * 100 : 0

  // Calcular ventas del mes anterior para la meta automática
  const today = new Date()
  const lastMonth = new Date()
  lastMonth.setMonth(lastMonth.getMonth() - 1)
  const lastMonthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1)
  const lastMonthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0)

  const { data: lastMonthInvoices } = await supabase
    .from("invoices")
    .select("total_amount")
    .gte("created_at", lastMonthStart.toISOString())
    .lte("created_at", lastMonthEnd.toISOString())

  const previousMonthSales = lastMonthInvoices?.reduce((sum, invoice) => sum + invoice.total_amount, 0) || 0

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Filtro de fecha global */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-medium mb-4">Filtrar por rango de fechas</h2>
        <DateRangePicker />
      </div>

      {/* Gráficos de productos más vendidos y ventas por mes */}
      <div className="grid gap-6 md:grid-cols-2">
        <DashboardCharts invoiceItems={invoiceItems || []} />
      </div>

      {/* Nuevos gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Ingresos totales por mes */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Ingresos Totales por Mes</h2>
          <MonthlyRevenueChart invoices={invoices || []} />
        </div>

        {/* Ganancia neta por mes */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Ganancia Neta por Mes</h2>
          <MonthlyProfitChart invoices={invoices || []} invoiceItems={invoiceItems || []} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Facturas pagadas vs. pendientes */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Facturas Pagadas vs. Pendientes</h2>
          <InvoiceStatusChart invoices={invoices || []} />
        </div>

        {/* Conversión de cotizaciones a ventas */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Conversión de Cotizaciones a Ventas</h2>
          <QuoteConversionIndicator conversionRate={conversionRate} />
        </div>
      </div>

      {/* Cumplimiento de metas de ventas */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-medium mb-4">Cumplimiento de Meta de Ventas</h2>
        <SalesGoalCard currentSales={totalSales} previousMonthSales={previousMonthSales} />
      </div>
    </div>
  )
}
