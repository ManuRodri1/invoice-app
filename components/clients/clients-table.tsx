"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, Phone, Mail, MapPin, FileText, User } from "lucide-react"
import { EditClientDialog } from "./edit-client-dialog"
import { DeleteClientDialog } from "./delete-client-dialog"
import type { Cliente } from "@/types"
import { ClientProfileDialog } from "./client-profile-dialog"

interface ClientsTableProps {
  clients: Cliente[]
  onClientUpdated: () => void
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

export function ClientsTable({ clients, onClientUpdated }: ClientsTableProps) {
  const [editingClient, setEditingClient] = useState<Cliente | null>(null)
  const [deletingClient, setDeletingClient] = useState<Cliente | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [profileClient, setProfileClient] = useState<Cliente | null>(null)
  const [profileDialogOpen, setProfileDialogOpen] = useState(false)

  const handleEdit = (client: Cliente) => {
    setEditingClient(client)
    setEditDialogOpen(true)
  }

  const handleDelete = (client: Cliente) => {
    setDeletingClient(client)
    setDeleteDialogOpen(true)
  }

  const handleViewProfile = (client: Cliente) => {
    setProfileClient(client)
    setProfileDialogOpen(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No se encontraron clientes</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Fecha de Registro</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{client.nombre}</div>
                    {client.direccion && (
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        {client.direccion}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm">
                      <Phone className="h-3 w-3 mr-1" />
                      {client.telefono}
                    </div>
                    {client.correo && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Mail className="h-3 w-3 mr-1" />
                        {client.correo}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {client.documento ? (
                    <div className="flex items-center text-sm">
                      <FileText className="h-3 w-3 mr-1" />
                      {client.documento}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={getClientTypeColor(client.tipo_cliente)}>
                    {getClientTypeLabel(client.tipo_cliente)}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(client.created_at)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewProfile(client)}>
                        <User className="mr-2 h-4 w-4" />
                        Ver Perfil
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(client)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(client)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EditClientDialog
        client={editingClient}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onClientUpdated={onClientUpdated}
      />

      <DeleteClientDialog
        client={deletingClient}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onClientDeleted={onClientUpdated}
      />

      <ClientProfileDialog client={profileClient} open={profileDialogOpen} onOpenChange={setProfileDialogOpen} />
    </>
  )
}
