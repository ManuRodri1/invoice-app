"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { InvoiceItem } from "@/lib/types"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from "recharts"
import { useDateRange } from "@/contexts/date-range-context"

interface DashboardChartsProps {
  invoiceItems: InvoiceItem[]
}

export function DashboardCharts({ invoiceItems }: DashboardChartsProps) {
  const { dateRange, isFiltered } = useDateRange()

  const filteredItems = useMemo(() => {
    if (!isFiltered || !dateRange.from || !dateRange.to) {
      return invoiceItems
    }

    return invoiceItems.filter((item) => {
      const itemDate = new Date(item.created_at)
      const startDate = new Date(dateRange.from!)
      const endDate = new Date(dateRange.to!)

      // Ajustar las fechas para comparación completa del día
      startDate.setHours(0, 0, 0, 0)
      endDate.setHours(23, 59, 59, 999)

      return itemDate >= startDate && itemDate <= endDate
    })
  }, [invoiceItems, dateRange, isFiltered])

  // Preparar datos para el gráfico de dona (productos más vendidos)
  const pieData = useMemo(() => {
    const productSales = filteredItems.reduce(
      (acc, item) => {
        const productId = item.product_id
        const productName = item.product?.name || "Desconocido"

        if (!acc[productId]) {
          acc[productId] = {
            name: productName,
            value: 0,
          }
        }

        acc[productId].value += item.quantity
        return acc
      },
      {} as Record<string, { name: string; value: number }>,
    )

    return Object.values(productSales)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [filteredItems])

  // Preparar datos para el gráfico de barras (ventas por mes)
  const barData = useMemo(() => {
    if (isFiltered && dateRange.from && dateRange.to) {
      // Si hay filtro activo, agrupar por días o semanas según el rango
      const startDate = new Date(dateRange.from)
      const endDate = new Date(dateRange.to)
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays <= 31) {
        // Agrupar por días si el rango es menor a un mes
        const dailySales = filteredItems.reduce(
          (acc, item) => {
            const date = new Date(item.created_at)
            const day = date.toLocaleDateString("es", { day: "2-digit", month: "short" })

            if (!acc[day]) {
              acc[day] = 0
            }

            acc[day] += item.quantity
            return acc
          },
          {} as Record<string, number>,
        )

        return Object.entries(dailySales).map(([name, value]) => ({
          name,
          value,
        }))
      } else {
        // Agrupar por semanas si el rango es mayor
        const weeklySales = filteredItems.reduce(
          (acc, item) => {
            const date = new Date(item.created_at)
            const weekStart = new Date(date.setDate(date.getDate() - date.getDay()))
            const week = `Sem ${weekStart.toLocaleDateString("es", { day: "2-digit", month: "short" })}`

            if (!acc[week]) {
              acc[week] = 0
            }

            acc[week] += item.quantity
            return acc
          },
          {} as Record<string, number>,
        )

        return Object.entries(weeklySales).map(([name, value]) => ({
          name,
          value,
        }))
      }
    } else {
      // Sin filtro, agrupar por meses
      const monthlySales = filteredItems.reduce(
        (acc, item) => {
          const date = new Date(item.created_at)
          const month = date.toLocaleString("default", { month: "short" })

          if (!acc[month]) {
            acc[month] = 0
          }

          acc[month] += item.quantity
          return acc
        },
        {} as Record<string, number>,
      )

      return Object.entries(monthlySales).map(([name, value]) => ({
        name,
        value,
      }))
    }
  }, [filteredItems, isFiltered, dateRange])

  // Colores para el gráfico de dona
  const COLORS = ["#EC8330", "#8DC73F", "#f4a05a", "#a8d962", "#FFFFFF"]

  // Renderizador personalizado para las etiquetas del gráfico de dona
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="black"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${name}: ${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Productos Más Vendidos</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8DC73F"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => [`${value} unidades`, props.payload.name]}
                  contentStyle={{ color: "black" }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No hay datos para mostrar en el rango seleccionado
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {isFiltered && dateRange.from && dateRange.to ? `Ventas en el período seleccionado` : "Ventas por Mes"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8DC73F">
                  <LabelList dataKey="value" position="top" fill="black" fontSize={12} fontWeight="bold" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No hay datos para mostrar en el rango seleccionado
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
