"use client"

import { useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts"
import type { Invoice } from "@/lib/types"
import { useDateRange } from "@/contexts/date-range-context"
import { formatCurrency } from "@/lib/utils"

interface MonthlyRevenueChartProps {
  invoices: Invoice[]
}

export function MonthlyRevenueChart({ invoices }: MonthlyRevenueChartProps) {
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
        const dailyRevenue: Record<string, number> = {}

        filteredInvoices.forEach((invoice) => {
          const date = new Date(invoice.created_at)
          const day = date.toLocaleDateString("es", { day: "2-digit", month: "short" })

          if (!dailyRevenue[day]) {
            dailyRevenue[day] = 0
          }

          dailyRevenue[day] += invoice.total_amount
        })

        return Object.entries(dailyRevenue).map(([day, revenue]) => ({
          month: day,
          revenue,
        }))
      } else {
        // Agrupar por semanas
        const weeklyRevenue: Record<string, number> = {}

        filteredInvoices.forEach((invoice) => {
          const date = new Date(invoice.created_at)
          const weekStart = new Date(date.setDate(date.getDate() - date.getDay()))
          const week = `Sem ${weekStart.toLocaleDateString("es", { day: "2-digit", month: "short" })}`

          if (!weeklyRevenue[week]) {
            weeklyRevenue[week] = 0
          }

          weeklyRevenue[week] += invoice.total_amount
        })

        return Object.entries(weeklyRevenue).map(([week, revenue]) => ({
          month: week,
          revenue,
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

        const monthRevenue = filteredInvoices
          .filter((invoice) => {
            const invoiceDate = new Date(invoice.created_at)
            return invoiceDate >= monthStart && invoiceDate <= monthEnd
          })
          .reduce((sum, invoice) => sum + invoice.total_amount, 0)

        data.push({
          month: monthName,
          revenue: monthRevenue,
        })
      }

      return data
    }
  }, [invoices, dateRange, isFiltered])

  // Formatear valores monetarios para el tooltip
  const formatTooltip = (value: number) => {
    return formatCurrency(value)
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      {chartData.length > 0 ? (
        <BarChart
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
          <Bar dataKey="revenue" fill="#8DC73F">
            <LabelList
              dataKey="revenue"
              position="top"
              formatter={(value: number) => formatCurrency(value)}
              fill="black"
              fontSize={12}
              fontWeight="bold"
            />
          </Bar>
        </BarChart>
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No hay datos para mostrar en el rango seleccionado
        </div>
      )}
    </ResponsiveContainer>
  )
}
