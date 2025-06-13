"use client"

import { useState } from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Printer, Download } from "lucide-react"
import type { Invoice, InvoiceItem } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils"

interface InvoiceDetailsProps {
  invoice: Invoice
  invoiceItems: InvoiceItem[]
}

export function InvoiceDetails({ invoice, invoiceItems }: InvoiceDetailsProps) {
  const [isPrinting, setIsPrinting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const handlePrint = () => {
    setIsPrinting(true)
    window.open(`/invoices/${invoice.id}/print`, "_blank")
    setTimeout(() => setIsPrinting(false), 1000)
  }

  const handleDownload = () => {
    setIsDownloading(true)
    // Usar la factura térmica como descarga por defecto
    window.open(`/invoices/${invoice.id}/thermal`, "_blank")
    setTimeout(() => setIsDownloading(false), 1000)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/invoices">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold">Factura {invoice.invoice_number}</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button onClick={handleDownload} disabled={isDownloading} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            {isDownloading ? "Descargando..." : "Descargar Factura"}
          </Button>
          <Button onClick={handlePrint} disabled={isPrinting} variant="outline" className="w-full sm:w-auto">
            <Printer className="mr-2 h-4 w-4" />
            {isPrinting ? "Imprimiendo..." : "Imprimir Factura"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Detalles del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-medium">{invoice.customer_name}</p>
              </div>
              {invoice.customer_rnc && (
                <div>
                  <p className="text-sm text-muted-foreground">RNC</p>
                  <p className="font-medium">{invoice.customer_rnc}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Fecha</p>
                <p className="font-medium">{formatDate(invoice.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Método de Pago</p>
                <p className="font-medium">{invoice.payment_method}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <Badge
                  variant="outline"
                  className={
                    invoice.payment_status === "Pagado"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }
                >
                  {invoice.payment_status}
                </Badge>
              </div>
              {invoice.delivery_date && (
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Entrega</p>
                  <p className="font-medium">{formatDate(invoice.delivery_date)}</p>
                </div>
              )}
            </div>

            {invoice.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notas</p>
                <p className="font-medium">{invoice.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatCurrency(invoice.subtotal || invoice.total_amount)}</span>
            </div>
            {invoice.apply_tax && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">ITBIS (18%)</span>
                <span className="font-medium">{formatCurrency(invoice.tax_amount || 0)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-4">
              <span className="text-lg font-bold">Total</span>
              <span className="text-lg font-bold">{formatCurrency(invoice.total_amount)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Productos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Precio Unitario</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoiceItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.product?.name}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.subtotal)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
