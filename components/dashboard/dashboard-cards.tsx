"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, ShoppingCart, AlertCircle, FileText } from "lucide-react"
import type { Invoice, InvoiceItem } from "@/lib/types"
import { useDateRange } from "@/contexts/date-range-context"
import { isWithinInterval, parseISO } from "date-fns"

interface DashboardCardsProps {
  allProducts: number
  allInvoices: Invoice[]
  allInvoiceItems: InvoiceItem[]
}

export function DashboardCards({ allProducts, allInvoices, allInvoiceItems }: DashboardCardsProps) {
  const { dateRange, isFiltered } = useDateRange()

  // Filtrar facturas por rango de fechas
  const filteredInvoices = useMemo(() => {
    if (!isFiltered) return allInvoices

    return allInvoices.filter((invoice) => {
      if (!invoice.created_at) return false
      const invoiceDate = parseISO(invoice.created_at)
      return isWithinInterval(invoiceDate, {
        start: dateRange.from,
        end: dateRange.to,
      })
    })
  }, [allInvoices, dateRange, isFiltered])

  // Filtrar items de factura por rango de fechas
  const filteredInvoiceItems = useMemo(() => {
    if (!isFiltered) return allInvoiceItems

    return allInvoiceItems.filter((item) => {
      if (!item.created_at) return false
      const itemDate = parseISO(item.created_at)
      return isWithinInterval(itemDate, {
        start: dateRange.from,
        end: dateRange.to,
      })
    })
  }, [allInvoiceItems, dateRange, isFiltered])

  // Calcular estadísticas filtradas
  const stats = useMemo(() => {
    const totalSold = filteredInvoiceItems.reduce((acc, item) => acc + item.quantity, 0)
    const pendingPayments = filteredInvoices.filter((invoice) => invoice.payment_status === "Pendiente").length
    const totalInvoices = filteredInvoices.length

    return {
      totalProducts: allProducts, // Los productos totales no cambian con el filtro
      totalSold,
      pendingPayments,
      totalInvoices,
    }
  }, [allProducts, filteredInvoices, filteredInvoiceItems])

  const cards = [
    {
      title: "Total Productos",
      value: stats.totalProducts,
      icon: Package,
      description: "Productos registrados",
      color: "text-blue-600",
    },
    {
      title: "Productos Vendidos",
      value: stats.totalSold,
      icon: ShoppingCart,
      description: isFiltered ? "En el período seleccionado" : "Total vendidos",
      color: "text-green-600",
    },
    {
      title: "Pagos Pendientes",
      value: stats.pendingPayments,
      icon: AlertCircle,
      description: isFiltered ? "En el período seleccionado" : "Facturas pendientes",
      color: "text-amber-600",
    },
    {
      title: "Total Facturas",
      value: stats.totalInvoices,
      icon: FileText,
      description: isFiltered ? "En el período seleccionado" : "Facturas generadas",
      color: "text-purple-600",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index} className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{card.title}</CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
