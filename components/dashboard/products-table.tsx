"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { FileDown, ChevronLeft, ChevronRight } from "lucide-react"
import type { Product, InvoiceItem } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { exportToExcel } from "@/lib/excel-exporter"

interface ProductsTableProps {
  products: Product[]
  invoiceItems: InvoiceItem[]
}

export function ProductsTable({ products, invoiceItems }: ProductsTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Calcular estadísticas de ventas por producto
  const productStats = products.map((product) => {
    const productItems = invoiceItems.filter((item) => item.product_id === product.id)
    const quantitySold = productItems.reduce((acc, item) => acc + item.quantity, 0)
    const revenue = productItems.reduce((acc, item) => acc + item.subtotal, 0)
    const profit = revenue - product.cost_price * quantitySold

    return {
      ...product,
      quantitySold,
      revenue,
      profit,
    }
  })

  // Calcular totales para el footer
  const totalQuantitySold = productStats.reduce((acc, product) => acc + product.quantitySold, 0)
  const totalInvestment = productStats.reduce((acc, product) => acc + product.cost_price * product.quantitySold, 0)
  const totalRevenue = productStats.reduce((acc, product) => acc + product.revenue, 0)
  const totalProfit = productStats.reduce((acc, product) => acc + product.profit, 0)

  // Paginación
  const totalPages = Math.ceil(productStats.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = productStats.slice(startIndex, endIndex)

  const handleExportToExcel = () => {
    const dataToExport = productStats.map((product) => ({
      Producto: product.name,
      "Cantidad Vendida": product.quantitySold,
      Inversión: product.cost_price,
      "Precio de Venta": product.sale_price,
      Ganancias: product.profit,
    }))

    exportToExcel(dataToExport, "Productos_y_Ganancias", "Productos")
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
                  No hay productos registrados
                </TableCell>
              </TableRow>
            ) : (
              currentItems.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.quantitySold}</TableCell>
                  <TableCell>{formatCurrency(product.cost_price)}</TableCell>
                  <TableCell>{formatCurrency(product.sale_price)}</TableCell>
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
              <TableCell className="font-bold">{totalQuantitySold}</TableCell>
              <TableCell className="font-bold">{formatCurrency(totalInvestment)}</TableCell>
              <TableCell className="font-bold">{formatCurrency(totalRevenue)}</TableCell>
              <TableCell className={`font-bold ${totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(totalProfit)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Página anterior</span>
          </Button>
          <div className="text-sm">
            Página {currentPage} de {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Página siguiente</span>
          </Button>
        </div>
      )}
    </div>
  )
}
