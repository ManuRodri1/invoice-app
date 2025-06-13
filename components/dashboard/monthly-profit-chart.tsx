"use client"

import { useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import type { Invoice, InvoiceItem } from "@/lib/types"
import { useDateRange } from "@/contexts/date-range-context"
import { formatCurrency } from "@/lib/utils"

interface MonthlyProfitChartProps {
  invoices: Invoice[]
  invoiceItems: InvoiceItem[]
}

export function MonthlyProfitChart({ invoices, invoiceItems }: MonthlyProfitChartProps) {
  const { dateRange, isFiltered } = useDateRange()

  const chartData = useMemo(() => {
    // Filtrar facturas por rango de fechas si es necesario
    const filteredInvoices =
      isFiltered && dateRange.from && dateRange.to
        ? invoices.filter((invoice) => {
            const invoiceDate = new Date(invoice.created_at)
            const startDate = new Date(dateRange.from!)
            const endDate = new Date(dateRange.to!)

            startDate.setHours(0, 0, 0, 0)
            endDate.setHours(23, 59, 59, 999)

            return invoiceDate >= startDate && invoiceDate <= endDate
          })
        : invoices

    if (isFiltered && dateRange.from && dateRange.to) {
      // Si hay filtro activo, agrupar por días o semanas
      const startDate = new Date(dateRange.from)
      const endDate = new Date(dateRange.to)
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays <= 31) {
        // Agrupar por días
        const dailyData: Record<string, { revenue: number; cost: number; profit: number }> = {}

        filteredInvoices.forEach((invoice) => {
          const date = new Date(invoice.created_at)
          const day = date.toLocaleDateString("es", { day: "2-digit", month: "short" })

          if (!dailyData[day]) {
            dailyData[day] = { revenue: 0, cost: 0, profit: 0 }
          }

          const revenue = invoice.total_amount
          const cost = invoiceItems
            .filter((item) => item.invoice_id === invoice.id)
            .reduce((itemSum, item) => {
              return itemSum + (item.product?.cost_price || 0) * item.quantity
            }, 0)

          dailyData[day].revenue += revenue
          dailyData[day].cost += cost
          dailyData[day].profit += revenue - cost
        })

        return Object.entries(dailyData).map(([day, data]) => ({
          month: day,
          ...data,
        }))
      } else {
        // Agrupar por semanas
        const weeklyData: Record<string, { revenue: number; cost: number; profit: number }> = {}

        filteredInvoices.forEach((invoice) => {
          const date = new Date(invoice.created_at)
          const weekStart = new Date(date.setDate(date.getDate() - date.getDay()))
          const week = `Sem ${weekStart.toLocaleDateString("es", { day: "2-digit", month: "short" })}`

          if (!weeklyData[week]) {
            weeklyData[week] = { revenue: 0, cost: 0, profit: 0 }
          }

          const revenue = invoice.total_amount
          const cost = invoiceItems
            .filter((item) => item.invoice_id === invoice.id)
            .reduce((itemSum, item) => {
              return itemSum + (item.product?.cost_price || 0) * item.quantity
            }, 0)

          weeklyData[week].revenue += revenue
          weeklyData[week].cost += cost
          weeklyData[week].profit += revenue - cost
        })

        return Object.entries(weeklyData).map(([week, data]) => ({
          month: week,
          ...data,
        }))
      }
    } else {
      // Sin filtro, agrupar por meses del año actual
      const currentDate = new Date()
      const currentYear = currentDate.getFullYear()
      const data = []

      for (let i = 0; i <= currentDate.getMonth(); i++) {
        const date = new Date(currentYear, i, 1)
        const monthName = date.toLocaleString("es", { month: "short" })
        const monthStart = new Date(currentYear, i, 1)
        const monthEnd = new Date(currentYear, i + 1, 0)

        const monthInvoices = filteredInvoices.filter((invoice) => {
          const invoiceDate = new Date(invoice.created_at)
          return invoiceDate >= monthStart && invoiceDate <= monthEnd
        })

        const revenue = monthInvoices.reduce((sum, invoice) => sum + invoice.total_amount, 0)
        const cost = monthInvoices.reduce((sum, invoice) => {
          const invoiceItemsCost = invoiceItems
            .filter((item) => item.invoice_id === invoice.id)
            .reduce((itemSum, item) => {
              return itemSum + (item.product?.cost_price || 0) * item.quantity
            }, 0)
          return sum + invoiceItemsCost
        }, 0)

        data.push({
          month: monthName,
          revenue,
          cost,
          profit: revenue - cost,
        })
      }

      return data
    }
  }, [invoices, invoiceItems, dateRange, isFiltered])

  // Formatear valores monetarios para el tooltip
  const formatTooltip = (value: number) => {
    return formatCurrency(value)
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      {chartData.length > 0 ? (
        <LineChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis
            tickFormatter={(value) => {
              if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
              if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
              return value
            }}
          />
          <Tooltip formatter={formatTooltip} />
          <Legend />
          <Line type="monotone" dataKey="revenue" stroke="#EC8330" activeDot={{ r: 8 }} name="Ingresos" />
          <Line type="monotone" dataKey="cost" stroke="#8DC73F" name="Costos" />
          <Line type="monotone" dataKey="profit" stroke="#f4a05a" strokeWidth={2} name="Ganancia Neta" />
        </LineChart>
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No hay datos para mostrar en el rango seleccionado
        </div>
      )}
    </ResponsiveContainer>
  )
}
