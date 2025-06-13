"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Printer, Trash2, Edit, FileText } from "lucide-react"
import type { Quote, QuoteItem } from "@/lib/types"
import { supabase } from "@/lib/supabase/client"
import { formatCurrency, formatDate } from "@/lib/utils"
import { DeleteQuoteDialog } from "./delete-quote-dialog"
import { EditQuoteDialog } from "./edit-quote-dialog"
import { ConvertToInvoiceDialog } from "./convert-to-invoice-dialog"
import { ResponsiveTable } from "@/components/ui/responsive-table"
import { useResponsive } from "@/hooks/use-responsive"

interface QuotesTableProps {
  initialQuotes: Quote[]
}

export function QuotesTable({ initialQuotes }: QuotesTableProps) {
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes)
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null)
  const [quoteToEdit, setQuoteToEdit] = useState<Quote | null>(null)
  const [quoteToConvert, setQuoteToConvert] = useState<Quote | null>(null)
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Usar el hook de responsividad
  const { isMobile } = useResponsive()

  const loadQuotes = async () => {
    setIsLoading(true)
    const { data } = await supabase.from("quotes").select("*").order("created_at", { ascending: false })
    if (data) setQuotes(data)
    setIsLoading(false)
  }

  useEffect(() => {
    // Cargar cotizaciones inicialmente
    loadQuotes()

    // Suscribirse a cambios en la tabla de cotizaciones
    const channel = supabase
      .channel("quotes-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "quotes" }, () => {
        loadQuotes()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Cargar items de cotización cuando se selecciona una cotización para editar o convertir
  useEffect(() => {
    const quoteId = quoteToEdit?.id || quoteToConvert?.id
    if (quoteId) {
      supabase
        .from("quote_items")
        .select("*, product:products(*)")
        .eq("quote_id", quoteId)
        .then(({ data }) => {
          if (data) setQuoteItems(data)
        })
    }
  }, [quoteToEdit, quoteToConvert])

  // Definir las columnas para la tabla responsiva
  const columns = [
    {
      header: "Número",
      accessorKey: "quote_number",
      cell: (value: string) => <span className="font-medium">{value}</span>,
    },
    {
      header: "Cliente",
      accessorKey: "customer_name",
    },
    {
      header: "Fecha",
      accessorKey: "created_at",
      cell: (value: string) => formatDate(value),
      className: isMobile ? "hidden" : "", // Ocultar en móvil
    },
    {
      header: "Estado",
      accessorKey: "status",
      cell: (value: string, row: Quote) => (
        <Badge
          variant="outline"
          className={
            value === "Convertida"
              ? "bg-blue-100 text-blue-800"
              : row.payment_status === "Pagado"
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
          }
        >
          {value === "Convertida" ? "Convertida" : row.payment_status}
        </Badge>
      ),
    },
    {
      header: "Total",
      accessorKey: "total_amount",
      cell: (value: number) => formatCurrency(value),
    },
    {
      header: "Acciones",
      accessorKey: "actions",
      cell: (_, row: Quote) => (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/quotes/${row.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setQuoteToEdit(row)}
            disabled={row.status === "Convertida"}
          >
            <Edit className="h-4 w-4" />
          </Button>
          {row.status !== "Convertida" && (
            <Button variant="outline" size="icon" onClick={() => setQuoteToConvert(row)} className="bg-primary/10">
              <FileText className="h-4 w-4" />
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={() => window.open(`/quotes/${row.id}/print`, "_blank")}>
            <Printer className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setQuoteToDelete(row)}
            disabled={row.status === "Convertida"}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      className: "w-[280px]",
    },
  ]

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <>
      {/* // Tabla responsiva de cotizaciones */}
      <ResponsiveTable
        data={quotes}
        columns={columns}
        defaultPageSize={10}
        className="w-full"
        alwaysUsePagination={true}
      />

      {quoteToDelete && (
        <DeleteQuoteDialog quote={quoteToDelete} open={!!quoteToDelete} onOpenChange={() => setQuoteToDelete(null)} />
      )}

      {quoteToEdit && quoteItems.length > 0 && (
        <EditQuoteDialog
          quote={quoteToEdit}
          quoteItems={quoteItems}
          open={!!quoteToEdit}
          onOpenChange={() => setQuoteToEdit(null)}
        />
      )}

      {quoteToConvert && quoteItems.length > 0 && (
        <ConvertToInvoiceDialog
          quote={quoteToConvert}
          quoteItems={quoteItems}
          open={!!quoteToConvert}
          onOpenChange={() => setQuoteToConvert(null)}
        />
      )}
    </>
  )
}
