"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { inventoryService } from "@/lib/inventory-service"
import type { InventoryItem } from "@/lib/types"

interface InventoryAdjustDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  inventoryItem: InventoryItem
  onComplete: () => void
}

export function InventoryAdjustDialog({ open, onOpenChange, inventoryItem, onComplete }: InventoryAdjustDialogProps) {
  const [tipo, setTipo] = useState<"Entrada" | "Salida" | "Ajuste">("Entrada")
  const [cantidad, setCantidad] = useState(1)
  const [comentarios, setComentarios] = useState("")
  const [fechaEntrada, setFechaEntrada] = useState(() => {
    // Default to current date in YYYY-MM-DD format
    const today = new Date()
    return today.toISOString().split("T")[0]
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (cantidad <= 0) {
      toast({
        title: "Error",
        description: "La cantidad debe ser mayor a 0",
        variant: "destructive",
      })
      return
    }

    if (tipo === "Salida" && cantidad > inventoryItem.stock_actual) {
      toast({
        title: "Error",
        description: "No hay suficiente stock para realizar esta salida",
        variant: "destructive",
      })
      return
    }

    if ((tipo === "Entrada" || tipo === "Ajuste") && !fechaEntrada) {
      toast({
        title: "Error",
        description: "Debes seleccionar una fecha de entrada",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      await inventoryService.registerMovement({
        inventario_id: inventoryItem.id,
        tipo,
        cantidad,
        usuario: "Usuario Actual", // Idealmente, obtener el usuario actual del sistema
        comentarios,
        fecha_entrada: tipo === "Entrada" || tipo === "Ajuste" ? fechaEntrada : undefined,
      })

      toast({
        title: "Movimiento registrado",
        description: "El movimiento de inventario ha sido registrado exitosamente",
      })

      onOpenChange(false)
      onComplete()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al registrar el movimiento",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajustar Stock: {inventoryItem.product_name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Movimiento</Label>
            <Select value={tipo} onValueChange={(value) => setTipo(value as "Entrada" | "Salida" | "Ajuste")} required>
              <SelectTrigger id="tipo">
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Entrada">Entrada</SelectItem>
                <SelectItem value="Salida">Salida</SelectItem>
                <SelectItem value="Ajuste">Ajuste (Establecer valor)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(tipo === "Entrada" || tipo === "Ajuste") && (
            <div className="space-y-2">
              <Label htmlFor="fechaEntrada">Fecha de Entrada *</Label>
              <Input
                id="fechaEntrada"
                type="date"
                value={fechaEntrada}
                onChange={(e) => setFechaEntrada(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">Fecha en que se registra la entrada del stock.</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="cantidad">{tipo === "Ajuste" ? "Nuevo Valor" : "Cantidad"}</Label>
            <Input
              id="cantidad"
              type="number"
              min="1"
              value={cantidad}
              onChange={(e) => setCantidad(Number.parseInt(e.target.value) || 0)}
              required
            />
            {tipo === "Entrada" && (
              <p className="text-xs text-muted-foreground">
                Stock actual: {inventoryItem.stock_actual} → Nuevo stock: {inventoryItem.stock_actual + cantidad}
              </p>
            )}
            {tipo === "Salida" && (
              <p className="text-xs text-muted-foreground">
                Stock actual: {inventoryItem.stock_actual} → Nuevo stock: {inventoryItem.stock_actual - cantidad}
              </p>
            )}
            {tipo === "Ajuste" && (
              <p className="text-xs text-muted-foreground">
                Stock actual: {inventoryItem.stock_actual} → Nuevo stock: {cantidad}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="comentarios">Comentarios (opcional)</Label>
            <Textarea
              id="comentarios"
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              placeholder="Ingrese comentarios sobre este movimiento"
              rows={3}
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
  )
}
