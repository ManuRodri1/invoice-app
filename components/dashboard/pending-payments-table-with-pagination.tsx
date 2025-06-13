"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Download } from "lucide-react"
import type { Invoice, InvoiceItem } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils"
import { exportToExcel } from "@/lib/excel-exporter"

interface PendingPaymentsTableWithPaginationProps {
  pendingInvoices: Invoice[]
  invoiceItems: InvoiceItem[]
}

export function PendingPaymentsTableWithPagination({
  pendingInvoices,
  invoiceItems,
}: PendingPaymentsTableWithPaginationProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Calculate totals for each invoice
  const invoicesWithTotals = useMemo(() => {
    return pendingInvoices.map((invoice) => {
      const items = invoiceItems.filter((item) => item.invoice_id === invoice.id)
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
      return {
        ...invoice,
        totalQuantity,
        items,
      }
    })
  }, [pendingInvoices, invoiceItems])

  // Calculate grand totals
  const grandTotals = useMemo(() => {
    const totalAmount = invoicesWithTotals.reduce((sum, invoice) => sum + invoice.total_amount, 0)
    const totalProducts = invoicesWithTotals.reduce((sum, invoice) => sum + invoice.totalQuantity, 0)
    return { totalAmount, totalProducts }
  }, [invoicesWithTotals])

  // Pagination
  const totalPages = Math.ceil(invoicesWithTotals.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentInvoices = invoicesWithTotals.slice(startIndex, endIndex)

  const handleExport = () => {
    const exportData = invoicesWithTotals.map((invoice) => ({
      "Número de Factura": invoice.invoice_number,
      Cliente: invoice.customer_name,
      RNC: invoice.customer_rnc || "N/A",
      "Método de Pago": invoice.payment_method,
      "Fecha de Creación": formatDate(invoice.created_at),
      "Cantidad de Productos": invoice.totalQuantity,
      Total: invoice.total_amount,
    }))

    exportToExcel(exportData, "pagos-pendientes")
  }

  if (invoicesWithTotals.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No hay pagos pendientes</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="text-sm text-muted-foreground">
          <p>
            Mostrando {startIndex + 1}-{Math.min(endIndex, invoicesWithTotals.length)} de {invoicesWithTotals.length}{" "}
            pagos pendientes
          </p>
          <p className="text-xs mt-1 text-amber-600">
            ⚠️ Esta tabla no se ve afectada por el filtro de fechas y muestra todos los pagos pendientes
          </p>
        </div>
        <Button onClick={handleExport} variant="outline" size="sm" className="w-full sm:w-auto">
          <Download className="mr-2 h-4 w-4" />
          Exportar Excel
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Factura</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="hidden sm:table-cell">RNC</TableHead>
              <TableHead className="hidden md:table-cell">Método de Pago</TableHead>
              <TableHead className="hidden lg:table-cell">Fecha</TableHead>
              <TableHead className="text-right">Productos</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-center">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentInvoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                <TableCell className="max-w-[150px] truncate">{invoice.customer_name}</TableCell>
                <TableCell className="hidden sm:table-cell">{invoice.customer_rnc || "N/A"}</TableCell>
                <TableCell className="hidden md:table-cell">{invoice.payment_method}</TableCell>
                <TableCell className="hidden lg:table-cell">{formatDate(invoice.created_at)}</TableCell>
                <TableCell className="text-right">{invoice.totalQuantity}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(invoice.total_amount)}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                    Pendiente
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={5} className="font-bold text-right">
                TOTAL PENDIENTE
              </TableCell>
              <TableCell className="text-right font-bold">{grandTotals.totalProducts}</TableCell>
              <TableCell className="text-right font-bold">{formatCurrency(grandTotals.totalAmount)}</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
