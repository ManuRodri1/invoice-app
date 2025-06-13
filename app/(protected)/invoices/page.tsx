import { createServerClient } from "@/lib/supabase/server"
import { InvoicesTable } from "@/components/invoices/invoices-table"
import { CreateInvoiceButton } from "@/components/invoices/create-invoice-button"
import { BusinessConfigDialog } from "@/components/business/business-config-dialog"

export default async function InvoicesPage() {
  const supabase = createServerClient()
  const { data: invoices } = await supabase.from("invoices").select("*").order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Facturación</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <BusinessConfigDialog />
          <CreateInvoiceButton />
        </div>
      </div>

      <InvoicesTable initialInvoices={invoices || []} />
    </div>
  )
}
