"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { inventoryService } from "@/lib/inventory-service"
import { getProducts } from "@/lib/product-service"
import type { Product } from "@/lib/types"
import { Plus } from "lucide-react"

interface AddInventoryDialogProps {
  onSuccess?: () => void
}

export function AddInventoryDialog({ onSuccess }: AddInventoryDialogProps) {
  const [open, setOpen] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Form state
  const [productId, setProductId] = useState("")
  const [stockActual, setStockActual] = useState(0)
  const [stockMinimo, setStockMinimo] = useState(5)
  const [stockMaximo, setStockMaximo] = useState(20)
  const [ubicacion, setUbicacion] = useState("")
  const [fechaEntrada, setFechaEntrada] = useState(() => {
    // Default to current date in YYYY-MM-DD format
    const today = new Date()
    return today.toISOString().split("T")[0]
  })

  useEffect(() => {
    if (open) {
      loadProducts()
    }
  }, [open])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await getProducts()
      setProducts(data)
    } catch (error) {
      console.error("Error al cargar productos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setProductId("")
    setStockActual(0)
    setStockMinimo(5)
    setStockMaximo(20)
    setUbicacion("")
    // Reset to current date
    const today = new Date()
    setFechaEntrada(today.toISOString().split("T")[0])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!productId) {
      toast({
        title: "Error",
        description: "Debes seleccionar un producto",
        variant: "destructive",
      })
      return
    }

    if (stockMaximo <= stockMinimo) {
      toast({
        title: "Error",
        description: "El stock máximo debe ser mayor al stock mínimo",
        variant: "destructive",
      })
      return
    }

    if (!ubicacion) {
      toast({
        title: "Error",
        description: "Debes ingresar la ubicación del producto",
        variant: "destructive",
      })
      return
    }

    if (!fechaEntrada) {
      toast({
        title: "Error",
        description: "Debes seleccionar una fecha de entrada",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      console.log("📦 Agregando inventario con stock inicial:", stockActual)

      await inventoryService.addInventoryItemWithEntry({
        product_id: productId,
        stock_actual: stockActual,
        stock_minimo: stockMinimo,
        stock_maximo: stockMaximo,
        ubicacion,
        fecha_entrada: fechaEntrada,
      })

      toast({
        title: "Inventario agregado",
        description: `Producto agregado con stock inicial de ${stockActual} unidades`,
      })

      resetForm()
      setOpen(false)

      // Llamar al callback de éxito
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      console.error("❌ Error al agregar inventario:", error)
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al agregar el producto al inventario",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Agregar Inventario
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Agregar Producto al Inventario</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product">Producto</Label>
              <Select value={productId} onValueChange={setProductId} required>
                <SelectTrigger id="product">
                  <SelectValue placeholder="Selecciona un producto" />
                </SelectTrigger>
                <SelectContent>
                  {loading ? (
                    <SelectItem value="loading" disabled>
                      Cargando productos...
                    </SelectItem>
                  ) : (
                    products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fechaEntrada">Fecha de Entrada *</Label>
              <Input
                id="fechaEntrada"
                type="date"
                value={fechaEntrada}
                onChange={(e) => setFechaEntrada(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Fecha en que se registra la entrada del stock. Por defecto es hoy.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stockActual">Stock Inicial</Label>
                <Input
                  id="stockActual"
                  type="number"
                  min="0"
                  value={stockActual}
                  onChange={(e) => setStockActual(Number.parseInt(e.target.value) || 0)}
                  required
                />
                <p className="text-xs text-muted-foreground">Cantidad exacta que se registrará</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stockMinimo">Stock Mínimo</Label>
                <Input
                  id="stockMinimo"
                  type="number"
                  min="0"
                  value={stockMinimo}
                  onChange={(e) => setStockMinimo(Number.parseInt(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stockMaximo">Stock Máximo</Label>
                <Input
                  id="stockMaximo"
                  type="number"
                  min="1"
                  value={stockMaximo}
                  onChange={(e) => setStockMaximo(Number.parseInt(e.target.value) || 0)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ubicacion">Ubicación</Label>
              <Input
                id="ubicacion"
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
                placeholder="Ej: Almacén principal, Estantería A, etc."
                required
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
