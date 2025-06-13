"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import type { Quote, QuoteItem } from "@/lib/types"

interface ConvertToInvoiceDialogProps {
  quote: Quote
  quoteItems: QuoteItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ConvertToInvoiceDialog({ quote, quoteItems, open, onOpenChange }: ConvertToInvoiceDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleConvert() {
    setIsLoading(true)

    try {
      // Generar número de factura
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`

      // Crear factura a partir de la cotización
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert([
          {
            invoice_number: invoiceNumber,
            customer_name: quote.customer_name,
            customer_rnc: quote.customer_rnc,
            payment_method: quote.payment_method,
            payment_status: quote.payment_status,
            delivery_date: quote.delivery_date,
            notes: quote.notes,
            subtotal: quote.subtotal,
            tax_amount: quote.tax_amount,
            total_amount: quote.total_amount,
            apply_tax: quote.apply_tax,
          },
        ])
        .select()
        .single()

      if (invoiceError) throw invoiceError

      // Crear items de factura a partir de los items de la cotización
      const invoiceItems = quoteItems.map((item) => ({
        invoice_id: invoice.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
      }))

      const { error: itemsError } = await supabase.from("invoice_items").insert(invoiceItems)

      if (itemsError) throw itemsError

      // Actualizar estado de la cotización a "Convertida"
      const { error: updateError } = await supabase.from("quotes").update({ status: "Convertida" }).eq("id", quote.id)

      if (updateError) throw updateError

      toast({
        title: "Cotización convertida",
        description: "La cotización ha sido convertida a factura exitosamente",
      })

      onOpenChange(false)

      // Redirigir a la página de la factura
      router.push(`/invoices/${invoice.id}`)
    } catch (error) {
      console.error("Error al convertir cotización:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al convertir la cotización a factura",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Convertir a Factura</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que deseas convertir la cotización{" "}
            <span className="font-medium">{quote.quote_number}</span> en una factura? Esta acción marcará la cotización
            como "Convertida".
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConvert} disabled={isLoading} className="bg-primary hover:bg-primary/90">
            {isLoading ? "Convirtiendo..." : "Convertir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
