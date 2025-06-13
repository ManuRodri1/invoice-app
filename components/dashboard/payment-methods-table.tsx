"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"
import type { Invoice } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { exportToExcel } from "@/lib/excel-exporter"
import { Pagination } from "@/components/ui/pagination"
import { useDateRange } from "@/contexts/date-range-context"

interface PaymentMethodsTableProps {
  invoices: Invoice[]
}

export function PaymentMethodsTable({ invoices }: PaymentMethodsTableProps) {
  const { dateRange, isFiltered } = useDateRange()
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Filter invoices by date range
  const filteredInvoices = useMemo(() => {
    if (!isFiltered || !dateRange.from || !dateRange.to) {
      return invoices
    }

    return invoices.filter((invoice) => {
      if (!invoice.created_at) return false
      const invoiceDate = new Date(invoice.created_at)
      return invoiceDate >= dateRange.from! && invoiceDate <= dateRange.to!
    })
  }, [invoices, dateRange, isFiltered])

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1)
  }, [dateRange, isFiltered])

  // Calcular estadísticas por método de pago
  const paymentMethodStats = filteredInvoices.reduce(
    (acc, invoice) => {
      const method = invoice.payment_method || "No especificado"

      if (!acc[method]) {
        acc[method] = {
          method,
          count: 0,
          total: 0,
        }
      }

      acc[method].count += 1
      acc[method].total += invoice.total_amount

      return acc
    },
    {} as Record<string, { method: string; count: number; total: number }>,
  )

  const paymentMethods = Object.values(paymentMethodStats)

  // Calcular totales
  const totalCount = paymentMethods.reduce((acc, item) => acc + item.count, 0)
  const totalAmount = paymentMethods.reduce((acc, item) => acc + item.total, 0)

  // Paginación
  const totalPages = Math.ceil(paymentMethods.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = paymentMethods.slice(startIndex, endIndex)

  const handleExportToExcel = () => {
    const dataToExport = paymentMethods.map((item) => ({
      "Método de Pago": item.method,
      "Cantidad de Pagos": item.count,
      "Monto Total": item.total,
    }))

    exportToExcel(dataToExport, "Metodos_de_Pago", "Pagos")
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExportToExcel}>
          <FileDown className="mr-2 h-4 w-4" />
          Exportar a Excel
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Método de Pago</TableHead>
              <TableHead className="text-right">Cantidad de Pagos</TableHead>
              <TableHead className="text-right">Monto Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  No hay datos disponibles
                </TableCell>
              </TableRow>
            ) : (
              currentItems.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.method}</TableCell>
                  <TableCell className="text-right">{item.count}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="font-bold">TOTAL</TableCell>
              <TableCell className="text-right font-bold">{totalCount}</TableCell>
              <TableCell className="text-right font-bold">{formatCurrency(totalAmount)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
    </div>
  )
}
