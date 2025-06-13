import { createServerClient } from "@/lib/supabase/server"
import { QuotesTable } from "@/components/quotes/quotes-table"
import { CreateQuoteButton } from "@/components/quotes/create-quote-button"

export default async function QuotesPage() {
  const supabase = createServerClient()
  const { data: quotes } = await supabase.from("quotes").select("*").order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Cotizaciones</h1>
        <CreateQuoteButton />
      </div>

      <QuotesTable initialQuotes={quotes || []} />
    </div>
  )
}
