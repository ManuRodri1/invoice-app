import { createServerClient } from "@/lib/supabase/server"
import { ThermalInvoice } from "@/components/invoices/thermal-invoice"
import { notFound } from "next/navigation"

interface ThermalInvoicePageProps {
  params: {
    id: string
  }
}

export default async function ThermalInvoicePage({ params }: ThermalInvoicePageProps) {
  const supabase = createServerClient()

  // Obtener la factura
  const { data: invoice } = await supabase.from("invoices").select("*").eq("id", params.id).single()

  if (!invoice) {
    notFound()
  }

  // Obtener los items de la factura
  const { data: invoiceItems } = await supabase
    .from("invoice_items")
    .select(`
      *,
      product:products(*)
    `)
    .eq("invoice_id", params.id)

  return <ThermalInvoice invoice={invoice} invoiceItems={invoiceItems || []} />
}
