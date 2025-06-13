import { notFound } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { QuotePrint } from "@/components/quotes/quote-print"

interface QuotePrintPageProps {
  params: {
    id: string
  }
}

export default async function QuotePrintPage({ params }: QuotePrintPageProps) {
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

  return <QuotePrint quote={quote} quoteItems={quoteItems || []} />
}
