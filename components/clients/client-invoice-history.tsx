"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"

interface Invoice {
  id: string
  invoice_number: string
  total_amount: number
  payment_status: string
  created_at: string
  customer_name: string
}

interface ClientInvoiceHistoryProps {
  clientId: string
  clientName: string
}

export function ClientInvoiceHistory({ clientId, clientName }: ClientInvoiceHistoryProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadClientInvoices()
  }, [clientId])

  const loadClientInvoices = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("invoices")
        .select("id, invoice_number, total_amount, payment_status, created_at, customer_name")
        .eq("customer_name", clientName)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading client invoices:", error)
        return
      }

      setInvoices(data || [])
    } catch (error) {
      console.error("Error in loadClientInvoices:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus.toLowerCase()) {
      case "paid":
      case "pagado":
      case "pagada":
        return <Badge className="bg-green-100 text-green-800">Pagada</Badge>
      case "pending":
      case "pendiente":
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
      case "overdue":
      case "vencida":
        return <Badge className="bg-red-100 text-red-800">Vencida</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{paymentStatus}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Historial de Facturas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Historial de Facturas ({invoices.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No hay facturas registradas para este cliente</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estatus</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{formatDate(invoice.created_at)}</TableCell>
                    <TableCell>{formatCurrency(invoice.total_amount)}</TableCell>
                    <TableCell>{getStatusBadge(invoice.payment_status)}</TableCell>
                    <TableCell>
                      <Link href={`/invoices/${invoice.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
