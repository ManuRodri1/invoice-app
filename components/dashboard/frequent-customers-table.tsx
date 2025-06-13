"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FileDown, Search } from "lucide-react"
import type { Invoice } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { exportToExcel } from "@/lib/excel-exporter"
import { Pagination } from "@/components/ui/pagination"
import { useDateRange } from "@/contexts/date-range-context"

interface FrequentCustomersTableProps {
  invoices: Invoice[]
}

export function FrequentCustomersTable({ invoices }: FrequentCustomersTableProps) {
  const { dateRange, isFiltered } = useDateRange()
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>(invoices)
  const itemsPerPage = 10

  // Filtrar facturas por rango de fechas
  useEffect(() => {
    if (isFiltered && dateRange.startDate && dateRange.endDate) {
      const filtered = invoices.filter((invoice) => {
        const invoiceDate = new Date(invoice.created_at)
        return invoiceDate >= dateRange.startDate! && invoiceDate <= dateRange.endDate!
      })
      setFilteredInvoices(filtered)
    } else {
      setFilteredInvoices(invoices)
    }
  }, [invoices, dateRange, isFiltered])

  // Calcular estadísticas por cliente
  const customerStats = filteredInvoices.reduce(
    (acc, invoice) => {
      const customerName = invoice.customer_name

      if (!acc[customerName]) {
        acc[customerName] = {
          name: customerName,
          purchaseCount: 0,
          totalAmount: 0,
        }
      }

      acc[customerName].purchaseCount += 1
      acc[customerName].totalAmount += invoice.total_amount

      return acc
    },
    {} as Record<string, { name: string; purchaseCount: number; totalAmount: number }>,
  )

  // Convertir a array y ordenar por cantidad de compras (descendente)
  const customers = Object.values(customerStats).sort((a, b) => b.purchaseCount - a.purchaseCount)

  // Filtrar por término de búsqueda
  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Calcular totales
  const totalPurchases = filteredCustomers.reduce((acc, customer) => acc + customer.purchaseCount, 0)
  const totalAmount = filteredCustomers.reduce((acc, customer) => acc + customer.totalAmount, 0)

  // Paginación
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = filteredCustomers.slice(startIndex, endIndex)

  // Resetear a la primera página cuando cambia la búsqueda
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const handleExportToExcel = () => {
    const dataToExport = filteredCustomers.map((customer) => ({
      Cliente: customer.name,
      "Total de Compras": customer.purchaseCount,
      "Total Facturado": customer.totalAmount,
    }))

    exportToExcel(dataToExport, "Clientes_Frecuentes", "Clientes")
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleExportToExcel}>
          <FileDown className="mr-2 h-4 w-4" />
          Exportar a Excel
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Total de Compras</TableHead>
              <TableHead className="text-right">Total Facturado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  No hay clientes registrados
                </TableCell>
              </TableRow>
            ) : (
              currentItems.map((customer, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell className="text-right">{customer.purchaseCount}</TableCell>
                  <TableCell className="text-right">{formatCurrency(customer.totalAmount)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="font-bold">TOTAL</TableCell>
              <TableCell className="text-right font-bold">{totalPurchases}</TableCell>
              <TableCell className="text-right font-bold">{formatCurrency(totalAmount)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
    </div>
  )
}
