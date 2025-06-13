"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2 } from "lucide-react"
import { ClientService } from "@/lib/client-service"
import { useToast } from "@/hooks/use-toast"
import type { Cliente } from "@/types"

interface DeleteClientDialogProps {
  client: Cliente | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onClientDeleted: () => void
}

export function DeleteClientDialog({ client, open, onOpenChange, onClientDeleted }: DeleteClientDialogProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!client) return

    setLoading(true)

    try {
      const success = await ClientService.deleteClient(client.id)

      if (success) {
        toast({
          title: "Cliente eliminado",
          description: "El cliente se ha eliminado exitosamente",
        })

        onOpenChange(false)
        onClientDeleted()
      } else {
        throw new Error("No se pudo eliminar el cliente")
      }
    } catch (error) {
      console.error("Error deleting client:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el cliente",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminará permanentemente el cliente <strong>{client?.nombre}</strong>{" "}
            de la base de datos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={loading} className="bg-red-600 hover:bg-red-700">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
