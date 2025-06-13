"use client"

import { useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from "recharts"
import type { Invoice } from "@/lib/types"
import { useDateRange } from "@/contexts/date-range-context"

interface InvoiceStatusChartProps {
  invoices: Invoice[]
}

export function InvoiceStatusChart({ invoices }: InvoiceStatusChartProps) {
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
        const dailyData: Record<string, { Pagado: number; Pendiente: number }> = {}

        filteredInvoices.forEach((invoice) => {
          const date = new Date(invoice.created_at)
          const day = date.toLocaleDateString("es", { day: "2-digit", month: "short" })

          if (!dailyData[day]) {
            dailyData[day] = { Pagado: 0, Pendiente: 0 }
          }

          if (invoice.payment_status === "Pagado") {
            dailyData[day].Pagado++
          } else {
            dailyData[day].Pendiente++
          }
        })

        return Object.entries(dailyData).map(([day, data]) => ({
          month: day,
          ...data,
        }))
      } else {
        // Agrupar por semanas
        const weeklyData: Record<string, { Pagado: number; Pendiente: number }> = {}

        filteredInvoices.forEach((invoice) => {
          const date = new Date(invoice.created_at)
          const weekStart = new Date(date.setDate(date.getDate() - date.getDay()))
          const week = `Sem ${weekStart.toLocaleDateString("es", { day: "2-digit", month: "short" })}`

          if (!weeklyData[week]) {
            weeklyData[week] = { Pagado: 0, Pendiente: 0 }
          }

          if (invoice.payment_status === "Pagado") {
            weeklyData[week].Pagado++
          } else {
            weeklyData[week].Pendiente++
          }
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

        const paid = monthInvoices.filter((invoice) => invoice.payment_status === "Pagado").length
        const pending = monthInvoices.filter((invoice) => invoice.payment_status === "Pendiente").length

        data.push({
          month: monthName,
          Pagado: paid,
          Pendiente: pending,
        })
      }

      return data
    }
  }, [invoices, dateRange, isFiltered])

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
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="Pagado" stackId="a" fill="#10B981">
            <LabelList dataKey="Pagado" position="top" fill="black" fontSize={12} fontWeight="bold" />
          </Bar>
          <Bar dataKey="Pendiente" stackId="a" fill="#F59E0B">
            <LabelList dataKey="Pendiente" position="top" fill="black" fontSize={12} fontWeight="bold" />
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
