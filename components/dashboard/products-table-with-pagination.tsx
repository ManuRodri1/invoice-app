"use client"

import { useState, useEffect, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FileDown, Search } from "lucide-react"
import type { Product, InvoiceItem } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { exportToExcel } from "@/lib/excel-exporter"
import { Pagination } from "@/components/ui/pagination"
import { useDateRange } from "@/contexts/date-range-context"
import { isWithinInterval, parseISO } from "date-fns"

interface ProductsTableWithPaginationProps {
  products: Product[]
  invoiceItems: InvoiceItem[]
}

export function ProductsTableWithPagination({ products, invoiceItems }: ProductsTableWithPaginationProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const { dateRange, isFiltered } = useDateRange()

  // Filtrar items de factura por rango de fechas
  const filteredInvoiceItems = useMemo(() => {
    if (!isFiltered) return invoiceItems

    return invoiceItems.filter((item) => {
      if (!item.created_at) return false
      const itemDate = parseISO(item.created_at)
      return isWithinInterval(itemDate, {
        start: dateRange.from,
        end: dateRange.to,
      })
    })
  }, [invoiceItems, dateRange, isFiltered])

  // Calcular estadísticas de ventas por producto para los items filtrados
  const productStats = useMemo(() => {
    return products
      .map((product) => {
        const productItems = filteredInvoiceItems.filter((item) => item.product_id === product.id)
        const quantitySold = productItems.reduce((acc, item) => acc + item.quantity, 0)
        const revenue = productItems.reduce((acc, item) => acc + item.subtotal, 0)
        const profit = revenue - (product.cost_price || 0) * quantitySold

        return {
          ...product,
          quantitySold,
          revenue,
          profit,
        }
      })
      .filter((product) => product.quantitySold > 0) // Solo mostrar productos vendidos
  }, [products, filteredInvoiceItems])

  // Filtrar productos por término de búsqueda
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return productStats
    return productStats.filter((product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [productStats, searchTerm])

  // Resetear página cuando cambia la búsqueda o el filtro de fechas
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, dateRange])

  // Calcular totales para el footer (solo para productos filtrados)
  const totals = useMemo(() => {
    return {
      totalQuantitySold: filteredProducts.reduce((acc, product) => acc + product.quantitySold, 0),
      totalInvestment: filteredProducts.reduce(
        (acc, product) => acc + (product.cost_price || 0) * product.quantitySold,
        0,
      ),
      totalRevenue: filteredProducts.reduce((acc, product) => acc + product.revenue, 0),
      totalProfit: filteredProducts.reduce((acc, product) => acc + product.profit, 0),
    }
  }, [filteredProducts])

  // Paginación
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = filteredProducts.slice(startIndex, endIndex)

  const handleExportToExcel = () => {
    const dataToExport = filteredProducts.map((product) => ({
      Producto: product.name,
      "Cantidad Vendida": product.quantitySold,
      Inversión: product.cost_price || 0,
      "Precio de Venta": product.sale_price || 0,
      Ganancias: product.profit,
    }))

    exportToExcel(dataToExport, "Productos_y_Ganancias", "Productos")
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar producto..."
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

      {/* Información del filtro */}
      {isFiltered && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            Mostrando productos vendidos entre {dateRange.from.toLocaleDateString()} y{" "}
            {dateRange.to.toLocaleDateString()}
          </p>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Cantidad Vendida</TableHead>
              <TableHead>Inversión</TableHead>
              <TableHead>Precio de Venta</TableHead>
              <TableHead>Ganancias</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  {isFiltered
                    ? "No hay productos vendidos en el rango de fechas seleccionado"
                    : "No hay productos registrados"}
                </TableCell>
              </TableRow>
            ) : (
              currentItems.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.quantitySold}</TableCell>
                  <TableCell>{formatCurrency(product.cost_price || 0)}</TableCell>
                  <TableCell>{formatCurrency(product.sale_price || 0)}</TableCell>
                  <TableCell className={product.profit >= 0 ? "text-green-600" : "text-red-600"}>
                    {formatCurrency(product.profit)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="font-bold">TOTAL</TableCell>
              <TableCell className="font-bold">{totals.totalQuantitySold}</TableCell>
              <TableCell className="font-bold">{formatCurrency(totals.totalInvestment)}</TableCell>
              <TableCell className="font-bold">{formatCurrency(totals.totalRevenue)}</TableCell>
              <TableCell className={`font-bold ${totals.totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(totals.totalProfit)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
    </div>
  )
}
