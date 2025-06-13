"use client"

import { useState, useEffect } from "react"
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
import { canDeleteProduct } from "@/lib/product-service"
import type { Product } from "@/lib/types"

interface DeleteProductDialogProps {
  product: Product
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteProductDialog({ product, open, onOpenChange }: DeleteProductDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  // Verificar si el producto puede ser eliminado cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      setIsChecking(true)
      setErrorMessage(null)

      canDeleteProduct(product.id).then((result) => {
        if (!result.canDelete && result.message) {
          setErrorMessage(result.message)
        }
        setIsChecking(false)
      })
    }
  }, [open, product.id])

  async function handleDelete() {
    setIsLoading(true)

    try {
      // Verificar nuevamente antes de eliminar
      const result = await canDeleteProduct(product.id)

      if (!result.canDelete) {
        setErrorMessage(result.message || "No se puede eliminar este producto")
        return
      }

      // Si se puede eliminar, proceder
      const { error } = await supabase.from("products").delete().eq("id", product.id)

      if (error) throw error

      toast({
        title: "Producto eliminado",
        description: "El producto ha sido eliminado exitosamente",
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Error al eliminar producto:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Ocurrió un error al eliminar el producto",
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
            Esta acción no se puede deshacer. Esto eliminará permanentemente el producto
            <span className="font-medium"> {product.name} </span>y todos los datos asociados.
          </AlertDialogDescription>
          {isChecking && (
            <div className="mt-2 flex items-center text-sm text-muted-foreground">
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              Verificando si el producto puede ser eliminado...
            </div>
          )}
          {errorMessage && <div className="mt-2 rounded-md bg-red-50 p-3 text-sm text-red-600">{errorMessage}</div>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading || isChecking || !!errorMessage}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
