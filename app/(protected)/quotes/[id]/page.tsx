import { notFound } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { QuoteDetails } from "@/components/quotes/quote-details"

interface QuotePageProps {
  params: {
    id: string
  }
}

export default async function QuotePage({ params }: QuotePageProps) {
  const supabase = createServerClient()

  // Obtener cotización con sus items
  const { data: quote } = await supabase.from("quotes").select("*").eq("id", params.id).single()

  if (!quote) {
    return notFound()
  }

  const { data: quoteItems } = await supabase
    .from("quote_items")
    .select("*, product:products(*)")
    .eq("quote_id", quote.id)

  return (
    <div className="space-y-6">
      <QuoteDetails quote={quote} quoteItems={quoteItems || []} />
    </div>
  )
}
