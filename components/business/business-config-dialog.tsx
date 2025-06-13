"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Settings } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { useBusinessConfig } from "@/hooks/use-business-config"

const businessConfigSchema = z.object({
  businessName: z.string().min(1, "El nombre del negocio es requerido"),
  rnc: z.string().min(1, "El RNC es requerido"),
  address: z.string().min(1, "La dirección es requerida"),
  phone: z.string().min(1, "El teléfono es requerido"),
  deliveryPhone: z.string().min(1, "El teléfono de delivery es requerido"),
  email: z.string().email("Email inválido").min(1, "El email es requerido"),
  cashierName: z.string().optional(),
})

type BusinessConfigValues = z.infer<typeof businessConfigSchema>

interface BusinessConfigDialogProps {
  children?: React.ReactNode
}

export function BusinessConfigDialog({ children }: BusinessConfigDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { config, updateConfig, isLoading: configLoading } = useBusinessConfig()

  const form = useForm<BusinessConfigValues>({
    resolver: zodResolver(businessConfigSchema),
    defaultValues: {
      businessName: "",
      rnc: "",
      address: "",
      phone: "",
      deliveryPhone: "",
      email: "",
      cashierName: "",
    },
  })

  // Cargar configuración cuando se abre el diálogo
  useEffect(() => {
    if (open && !configLoading) {
      form.reset({
        businessName: config.businessName,
        rnc: config.rnc,
        address: config.address,
        phone: config.phone,
        deliveryPhone: config.deliveryPhone,
        email: config.email,
        cashierName: config.cashierName || "",
      })
    }
  }, [open, config, configLoading, form])

  const onSubmit = async (values: BusinessConfigValues) => {
    setIsLoading(true)
    try {
      await updateConfig(values)

      toast.success("Configuración guardada exitosamente", {
        description: "Los cambios se aplicarán a todas las facturas y cotizaciones",
      })

      setOpen(false)
    } catch (error) {
      console.error("Error saving config:", error)
      toast.error("Error al guardar la configuración", {
        description: "Por favor, intenta nuevamente",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Configuración del negocio
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configuración del Negocio</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Negocio</FormLabel>
                  <FormControl>
                    <Input placeholder="Ingrese el nombre del negocio" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rnc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RNC</FormLabel>
                  <FormControl>
                    <Input placeholder="Ingrese el RNC" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ingrese la dirección completa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono Principal</FormLabel>
                  <FormControl>
                    <Input placeholder="Ingrese el teléfono principal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deliveryPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono para Delivery</FormLabel>
                  <FormControl>
                    <Input placeholder="Ingrese el teléfono para delivery" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Ingrese el email del negocio" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cashierName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Cajero/Empleado (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ingrese el nombre del empleado" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading || configLoading}>
                {isLoading ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
