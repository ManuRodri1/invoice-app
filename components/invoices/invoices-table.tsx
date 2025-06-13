"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Printer, Trash2, Edit, FileDown } from "lucide-react"
import type { Invoice, InvoiceItem } from "@/lib/types"
import { supabase } from "@/lib/supabase/client"
import { formatCurrency, formatDate } from "@/lib/utils"
import { DeleteInvoiceDialog } from "./delete-invoice-dialog"
import { EditInvoiceDialog } from "./edit-invoice-dialog"
import { ResponsiveTable } from "@/components/ui/responsive-table"
import { useResponsive } from "@/hooks/use-responsive"
import { Pagination } from "@/components/ui/pagination"

interface InvoicesTableProps {
  initialInvoices: Invoice[]
}

export function InvoicesTable({ initialInvoices }: InvoicesTableProps) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices)
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null)
  const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null)
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([])
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Usar el hook de responsividad
  const { isMobile } = useResponsive()

  const loadInvoices = async () => {
    setIsLoading(true)
    const { data } = await supabase.from("invoices").select("*").order("created_at", { ascending: false })
    if (data) setInvoices(data)
    setIsLoading(false)
  }

  useEffect(() => {
    // Cargar facturas inicialmente
    loadInvoices()

    // Suscribirse a cambios en la tabla de facturas
    const channel = supabase
      .channel("invoices-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "invoices" }, () => {
        loadInvoices()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Cargar items de factura cuando se selecciona una factura para editar
  useEffect(() => {
    if (invoiceToEdit) {
      supabase
        .from("invoice_items")
        .select("*, product:products(*)")
        .eq("invoice_id", invoiceToEdit.id)
        .then(({ data }) => {
          if (data) setInvoiceItems(data)
        })
    }
  }, [invoiceToEdit])

  const handleDownloadThermal = async (invoice: Invoice) => {
    setIsGeneratingPDF(invoice.id)
    try {
      // Abrir la factura térmica en nueva ventana
      window.open(`/invoices/${invoice.id}/thermal`, "_blank")
    } catch (error) {
      console.error("Error al generar factura térmica:", error)
    } finally {
      setIsGeneratingPDF(null)
    }
  }

  // Calcular paginación
  const totalPages = Math.ceil(invoices.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentInvoices = invoices.slice(startIndex, endIndex)

  // Definir las columnas para la tabla responsiva
  const columns = [
    {
      header: "Número",
      accessorKey: "invoice_number",
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
      accessorKey: "payment_status",
      cell: (value: string) => (
        <Badge
          variant="outline"
          className={value === "Pagado" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
        >
          {value}
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
      cell: (_, row: Invoice) => (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/invoices/${row.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="icon" onClick={() => setInvoiceToEdit(row)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleDownloadThermal(row)}
            disabled={isGeneratingPDF === row.id}
            title="Descargar Factura Térmica"
          >
            {isGeneratingPDF === row.id ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            ) : (
              <FileDown className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => window.open(`/invoices/${row.id}/print`, "_blank")}
            title="Imprimir Factura Tradicional"
          >
            <Printer className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setInvoiceToDelete(row)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      className: "w-[220px]",
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
    <div className="space-y-4">
      {/* Información de paginación */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {startIndex + 1} a {Math.min(endIndex, invoices.length)} de {invoices.length} facturas
        </p>
      </div>

      {/* Tabla responsiva de facturas */}
      <ResponsiveTable data={currentInvoices} columns={columns} defaultPageSize={itemsPerPage} className="w-full" />

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}

      {invoiceToDelete && (
        <DeleteInvoiceDialog
          invoice={invoiceToDelete}
          open={!!invoiceToDelete}
          onOpenChange={() => setInvoiceToDelete(null)}
        />
      )}

      {invoiceToEdit && invoiceItems.length > 0 && (
        <EditInvoiceDialog
          invoice={invoiceToEdit}
          invoiceItems={invoiceItems}
          open={!!invoiceToEdit}
          onOpenChange={() => setInvoiceToEdit(null)}
        />
      )}
    </div>
  )
}
