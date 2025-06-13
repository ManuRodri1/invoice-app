"use client"
import { QuotedProductsTable } from "./quoted-products-table"
import type { Quote, QuoteItem } from "@/lib/types"

interface QuotedProductsTableWithPaginationProps {
  quoteItems: (QuoteItem & {
    quote: Quote
    product: {
      id: string
      name: string
      sale_price: number
    }
  })[]
}

export function QuotedProductsTableWithPagination({ quoteItems }: QuotedProductsTableWithPaginationProps) {
  return (
    <div className="space-y-4">
      <QuotedProductsTable quoteItems={quoteItems} />
    </div>
  )
}
