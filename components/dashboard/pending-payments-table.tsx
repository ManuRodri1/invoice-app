"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileDown, ChevronLeft, ChevronRight } from "lucide-react"
import type { Invoice, InvoiceItem } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils"
import { exportToExcel } from "@/lib/excel-exporter"

interface PendingPaymentsTableProps {
  pendingInvoices: Invoice[]
  invoiceItems: InvoiceItem[]
}

export function PendingPaymentsTable({ pendingInvoices, invoiceItems }: PendingPaymentsTableProps) {
  // Calcular total pendiente
  const totalPendingAmount = pendingInvoices.reduce((acc, invoice) => acc + invoice.total_amount, 0)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const invoicesPerPage = 10 // You can adjust this value
  const totalPages = Math.ceil(pendingInvoices.length / invoicesPerPage)

  // Get current invoices
  const indexOfLastInvoice = currentPage * invoicesPerPage
  const indexOfFirstInvoice = indexOfLastInvoice - invoicesPerPage
  const currentInvoices = pendingInvoices.slice(indexOfFirstInvoice, indexOfLastInvoice)

  const handleExportToExcel = () => {
    const dataToExport = pendingInvoices.map((invoice) => ({
      Factura: invoice.invoice_number,
      Cliente: invoice.customer_name,
      "Fecha de Entrega": invoice.delivery_date ? formatDate(invoice.delivery_date) : "N/A",
      Estado: invoice.payment_status,
      "Monto Pendiente": invoice.total_amount,
    }))

    exportToExcel(dataToExport, "Pagos_Pendientes", "Pendientes")
  }

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
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
              <TableHead>Factura</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Fecha de Entrega</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Monto Pendiente</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No hay pagos pendientes
                </TableCell>
              </TableRow>
            ) : (
              currentInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                  <TableCell>{invoice.customer_name}</TableCell>
                  <TableCell>{invoice.delivery_date ? formatDate(invoice.delivery_date) : "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                      Pendiente
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(invoice.total_amount)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {pendingInvoices.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="font-bold text-right">
                  TOTAL PENDIENTE
                </TableCell>
                <TableCell className="font-bold">{formatCurrency(totalPendingAmount)}</TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4">
          <Button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>
          <span>
            Página {currentPage} de {totalPages}
          </span>
          <Button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            variant="outline"
            size="sm"
          >
            Siguiente
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
