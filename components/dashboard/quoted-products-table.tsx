"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Pagination } from "@/components/ui/pagination"
import { useDateRange } from "@/contexts/date-range-context"
import type { Quote, QuoteItem } from "@/lib/types"

interface QuotedProductsTableProps {
  quoteItems: (QuoteItem & {
    quote: Quote
    product: {
      id: string
      name: string
      sale_price: number
    }
  })[]
}

export function QuotedProductsTable({ quoteItems }: QuotedProductsTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const { dateRange, isFiltered } = useDateRange()

  // Filter quote items by date range
  const filteredQuoteItems = useMemo(() => {
    if (!isFiltered || !dateRange.from || !dateRange.to) {
      return quoteItems
    }

    return quoteItems.filter((item) => {
      if (!item.quote.created_at) return false
      const quoteDate = new Date(item.quote.created_at)
      return quoteDate >= dateRange.from! && quoteDate <= dateRange.to!
    })
  }, [quoteItems, dateRange, isFiltered])

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1)
  }, [dateRange, isFiltered])

  // Paginación
  const totalPages = Math.ceil(filteredQuoteItems.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = filteredQuoteItems.slice(startIndex, endIndex)

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No hay productos en cotizaciones
                </TableCell>
              </TableRow>
            ) : (
              currentItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.product.name}</TableCell>
                  <TableCell>{item.quote.customer_name}</TableCell>
                  <TableCell>{formatDate(item.quote.created_at)}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        item.quote.status === "Convertida"
                          ? "bg-blue-100 text-blue-800"
                          : item.quote.payment_status === "Pagado"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {item.quote.status === "Convertida" ? "Convertida" : item.quote.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.subtotal)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
    </div>
  )
}
