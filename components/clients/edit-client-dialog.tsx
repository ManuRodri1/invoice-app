"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { ClientService } from "@/lib/client-service"
import { useToast } from "@/hooks/use-toast"
import type { Cliente } from "@/types"

interface EditClientDialogProps {
  client: Cliente | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onClientUpdated: () => void
}

export function EditClientDialog({ client, open, onOpenChange, onClientUpdated }: EditClientDialogProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    correo: "",
    direccion: "",
    documento: "",
    tipo_cliente: "nuevo",
  })

  useEffect(() => {
    if (client) {
      setFormData({
        nombre: client.nombre || "",
        telefono: client.telefono || "",
        correo: client.correo || "",
        direccion: client.direccion || "",
        documento: client.documento || "",
        tipo_cliente: client.tipo_cliente || "nuevo",
      })
    }
  }, [client])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!client) return

    if (!formData.nombre.trim() || !formData.telefono.trim()) {
      toast({
        title: "Error",
        description: "El nombre y teléfono son campos requeridos",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const clientData = {
        nombre: formData.nombre.trim(),
        telefono: formData.telefono.trim(),
        correo: formData.correo.trim() || null,
        direccion: formData.direccion.trim() || null,
        documento: formData.documento.trim() || null,
        tipo_cliente: formData.tipo_cliente,
      }

      const result = await ClientService.updateClient(client.id, clientData)

      if (result) {
        toast({
          title: "Cliente actualizado",
          description: "Los datos del cliente se han actualizado exitosamente",
        })

        onOpenChange(false)
        onClientUpdated()
      } else {
        throw new Error("No se pudo actualizar el cliente")
      }
    } catch (error) {
      console.error("Error updating client:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el cliente",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
          <DialogDescription>
            Modifica la información del cliente. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Nombre completo del cliente"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="telefono">Teléfono *</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="Número de teléfono"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="correo">Correo Electrónico</Label>
              <Input
                id="correo"
                type="email"
                value={formData.correo}
                onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="documento">RNC o Cédula</Label>
              <Input
                id="documento"
                value={formData.documento}
                onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                placeholder="Número de documento"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tipo_cliente">Tipo de Cliente</Label>
              <Select
                value={formData.tipo_cliente}
                onValueChange={(value) => setFormData({ ...formData, tipo_cliente: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nuevo">Nuevo</SelectItem>
                  <SelectItem value="frecuente">Frecuente</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                  <SelectItem value="corporativo">Corporativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Textarea
                id="direccion"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                placeholder="Dirección completa del cliente"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Actualizar Cliente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
