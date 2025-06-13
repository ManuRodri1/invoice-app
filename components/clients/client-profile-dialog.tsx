"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Phone, Mail, MapPin, FileText, Calendar } from "lucide-react"
import { ClientInvoiceHistory } from "./client-invoice-history"
import type { Cliente } from "@/types"

interface ClientProfileDialogProps {
  client: Cliente | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const getClientTypeColor = (tipo: string) => {
  switch (tipo) {
    case "frecuente":
      return "bg-green-100 text-green-800"
    case "vip":
      return "bg-purple-100 text-purple-800"
    case "corporativo":
      return "bg-blue-100 text-blue-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getClientTypeLabel = (tipo: string) => {
  switch (tipo) {
    case "frecuente":
      return "Frecuente"
    case "vip":
      return "VIP"
    case "corporativo":
      return "Corporativo"
    default:
      return "Nuevo"
  }
}

export function ClientProfileDialog({ client, open, onOpenChange }: ClientProfileDialogProps) {
  if (!client) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Perfil del Cliente
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Información del Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{client.nombre}</span>
                <Badge className={getClientTypeColor(client.tipo_cliente)}>
                  {getClientTypeLabel(client.tipo_cliente)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>{client.telefono}</span>
              </div>

              {client.correo && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{client.correo}</span>
                </div>
              )}

              {client.direccion && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{client.direccion}</span>
                </div>
              )}

              {client.documento && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span>RNC/Cédula: {client.documento}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>Registrado: {formatDate(client.created_at)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Historial de Facturas */}
          <div className="md:col-span-2">
            <ClientInvoiceHistory clientId={client.id} clientName={client.nombre} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
