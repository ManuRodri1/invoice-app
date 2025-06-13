import { createServerClient } from "@/lib/supabase/server"
import { DashboardCards } from "@/components/dashboard/dashboard-cards"
import { ProductsTableWithPagination } from "@/components/dashboard/products-table-with-pagination"
import { PendingPaymentsTableWithPagination } from "@/components/dashboard/pending-payments-table-with-pagination"
import { QuotedProductsTableWithPagination } from "@/components/dashboard/quoted-products-table-with-pagination"
import { PaymentMethodsTable } from "@/components/dashboard/payment-methods-table"
import { FrequentCustomersTable } from "@/components/dashboard/frequent-customers-table"
import { DateRangePicker } from "@/components/dashboard/date-range-picker"

export default async function FinanzasPage() {
  const supabase = createServerClient()

  // Obtener estadísticas para el dashboard
  const { data: products } = await supabase.from("products").select("*")
  const { data: invoices } = await supabase.from("invoices").select("*")
  const { data: invoiceItems } = await supabase.from("invoice_items").select("*, product:products(*)")
  const { data: quoteItems } = await supabase.from("quote_items").select("*, quote:quotes(*), product:products(*)")

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Finanzas</h1>

      {/* Filtro de fecha global */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-medium mb-4">Filtrar por rango de fechas</h2>
        <DateRangePicker />
      </div>

      {/* Tarjetas de estadísticas */}
      <DashboardCards
        allProducts={products?.length || 0}
        allInvoices={invoices || []}
        allInvoiceItems={invoiceItems || []}
      />

      {/* Tabla de productos y ganancias */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Productos y Ganancias</h2>
        <ProductsTableWithPagination products={products || []} invoiceItems={invoiceItems || []} />
      </div>

      {/* Tabla de productos en cotizaciones */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Productos en Cotizaciones</h2>
        <QuotedProductsTableWithPagination quoteItems={quoteItems || []} />
      </div>

      {/* Tabla de pagos pendientes */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Pagos Pendientes</h2>
        <PendingPaymentsTableWithPagination
          pendingInvoices={invoices?.filter((invoice) => invoice.payment_status === "Pendiente") || []}
          invoiceItems={invoiceItems || []}
        />
      </div>

      {/* Nueva tabla de métodos de pago */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Métodos de Pago</h2>
        <PaymentMethodsTable invoices={invoices || []} />
      </div>

      {/* Nueva tabla de clientes frecuentes */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Clientes Frecuentes</h2>
        <FrequentCustomersTable invoices={invoices || []} />
      </div>
    </div>
  )
}
