"use client"

import { useState } from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Printer, FileText } from "lucide-react"
import type { Quote, QuoteItem } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils"
import { ConvertToInvoiceDialog } from "./convert-to-invoice-dialog"

interface QuoteDetailsProps {
  quote: Quote
  quoteItems: QuoteItem[]
}

export function QuoteDetails({ quote, quoteItems }: QuoteDetailsProps) {
  const [isPrinting, setIsPrinting] = useState(false)
  const [showConvertDialog, setShowConvertDialog] = useState(false)

  const handlePrint = () => {
    setIsPrinting(true)
    window.open(`/quotes/${quote.id}/print`, "_blank")
    setTimeout(() => setIsPrinting(false), 1000)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/quotes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold">Cotización {quote.quote_number}</h1>
          {quote.status === "Convertida" && <Badge className="ml-2 bg-blue-100 text-blue-800">Convertida</Badge>}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {quote.status !== "Convertida" && (
            <Button onClick={() => setShowConvertDialog(true)} variant="default" className="w-full sm:w-auto">
              <FileText className="mr-2 h-4 w-4" />
              Convertir a Factura
            </Button>
          )}
          <Button onClick={handlePrint} disabled={isPrinting} className="w-full sm:w-auto">
            <Printer className="mr-2 h-4 w-4" />
            {isPrinting ? "Imprimiendo..." : "Imprimir"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Detalles del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-medium break-words">{quote.customer_name}</p>
              </div>
              {quote.customer_rnc && (
                <div>
                  <p className="text-sm text-muted-foreground">RNC</p>
                  <p className="font-medium">{quote.customer_rnc}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Fecha</p>
                <p className="font-medium">{formatDate(quote.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Método de Pago</p>
                <p className="font-medium">{quote.payment_method}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <Badge
                  variant="outline"
                  className={
                    quote.status === "Convertida"
                      ? "bg-blue-100 text-blue-800"
                      : quote.payment_status === "Pagado"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                  }
                >
                  {quote.status === "Convertida" ? "Convertida" : quote.payment_status}
                </Badge>
              </div>
              {quote.delivery_date && (
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Entrega</p>
                  <p className="font-medium">{formatDate(quote.delivery_date)}</p>
                </div>
              )}
            </div>

            {quote.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notas</p>
                <p className="font-medium break-words">{quote.notes}</p>
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
              <span className="font-medium">{formatCurrency(quote.subtotal)}</span>
            </div>
            {quote.apply_tax && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">ITBIS (18%)</span>
                <span className="font-medium">{formatCurrency(quote.tax_amount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-4">
              <span className="text-lg font-bold">Total</span>
              <span className="text-lg font-bold">{formatCurrency(quote.total_amount)}</span>
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
                {quoteItems.map((item) => (
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

      <ConvertToInvoiceDialog
        quote={quote}
        quoteItems={quoteItems}
        open={showConvertDialog}
        onOpenChange={setShowConvertDialog}
      />
    </div>
  )
}
