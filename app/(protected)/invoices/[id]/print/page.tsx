import { notFound } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { InvoicePrint } from "@/components/invoices/invoice-print"

interface InvoicePrintPageProps {
  params: {
    id: string
  }
}

export default async function InvoicePrintPage({ params }: InvoicePrintPageProps) {
  const supabase = createServerClient()

  // Obtener factura con sus items
  const { data: invoice } = await supabase.from("invoices").select("*").eq("id", params.id).single()

  if (!invoice) {
    return notFound()
  }

  const { data: invoiceItems } = await supabase
    .from("invoice_items")
    .select("*, product:products(*)")
    .eq("invoice_id", invoice.id)

  return <InvoicePrint invoice={invoice} invoiceItems={invoiceItems || []} />
}
