import { notFound } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { InvoiceDetails } from "@/components/invoices/invoice-details"

interface InvoicePageProps {
  params: {
    id: string
  }
}

export default async function InvoicePage({ params }: InvoicePageProps) {
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

  return (
    <div className="space-y-6">
      <InvoiceDetails invoice={invoice} invoiceItems={invoiceItems || []} />
    </div>
  )
}
