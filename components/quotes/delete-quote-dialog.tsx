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
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import type { Quote } from "@/lib/types"

interface DeleteQuoteDialogProps {
  quote: Quote
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteQuoteDialog({ quote, open, onOpenChange }: DeleteQuoteDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleDelete() {
    setIsLoading(true)

    try {
      const { error } = await supabase.from("quotes").delete().eq("id", quote.id)

      if (error) throw error

      toast({
        title: "Cotización eliminada",
        description: "La cotización ha sido eliminada exitosamente",
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Error al eliminar cotización:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar la cotización",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Esto eliminará permanentemente la cotización
            <span className="font-medium"> {quote.quote_number} </span>y todos los datos asociados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isLoading} className="bg-red-600 hover:bg-red-700">
            {isLoading ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
