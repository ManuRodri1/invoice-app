"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { CalendarIcon, Minus, Plus, Trash2, UserPlus } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import { inventoryService } from "@/lib/inventory-service"
import { ClientService } from "@/lib/client-service"
import { AddClientDialog } from "@/components/clients/add-client-dialog"
import type { Product, Cliente } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"

const formSchema = z.object({
  selected_client_id: z.string().optional(),
  customer_name: z.string().min(1, "El nombre del cliente es requerido"),
  customer_rnc: z.string().optional(),
  customer_phone: z.string().optional(),
  customer_address: z.string().optional(),
  payment_method: z.string().min(1, "El método de pago es requerido"),
  payment_status: z.string().min(1, "El estado del pago es requerido"),
  delivery_date: z.date().optional(),
  notes: z.string().optional(),
  apply_tax: z.boolean().default(true),
  items: z
    .array(
      z.object({
        product_id: z.string().min(1, "Selecciona un producto"),
        quantity: z.coerce.number().min(1, "La cantidad debe ser al menos 1"),
        unit_price: z.coerce.number().min(0.01, "El precio debe ser mayor a 0"),
      }),
    )
    .min(1, "Agrega al menos un producto"),
})

type FormValues = z.infer<typeof formSchema>

interface CreateInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateInvoiceDialog({ open, onOpenChange }: CreateInvoiceDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [clients, setClients] = useState<Cliente[]>([])
  const [showAddClient, setShowAddClient] = useState(false)
  const router = useRouter()
  const isMobile = useMobile()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      selected_client_id: "",
      customer_name: "",
      customer_rnc: "",
      customer_phone: "",
      customer_address: "",
      payment_method: "",
      payment_status: "",
      notes: "",
      apply_tax: true,
      items: [{ product_id: "", quantity: 1, unit_price: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  // Cargar productos y clientes
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)

      // Cargar productos
      const { data: productsData } = await supabase.from("products").select("*")
      if (productsData) setProducts(productsData)

      // Cargar clientes
      const clientsData = await ClientService.getClients()
      setClients(clientsData)

      // Verificar si hay un producto seleccionado en localStorage
      const selectedProductId = localStorage.getItem("selectedProductId")
      if (selectedProductId) {
        const selectedProduct = productsData?.find((p) => p.id === selectedProductId)
        if (selectedProduct) {
          form.setValue("items.0.product_id", selectedProduct.id)
          form.setValue("items.0.unit_price", selectedProduct.sale_price)
        }
        localStorage.removeItem("selectedProductId")
      }

      setIsLoading(false)
    }

    if (open) {
      loadData()
    }
  }, [form, open])

  // Manejar selección de cliente
  const handleClientSelect = (clientId: string) => {
    if (clientId === "new") {
      setShowAddClient(true)
      return
    }

    const selectedClient = clients.find((c) => c.id === clientId)
    if (selectedClient) {
      form.setValue("customer_name", selectedClient.nombre)
      form.setValue("customer_rnc", selectedClient.documento || "")
      form.setValue("customer_phone", selectedClient.telefono)
      form.setValue("customer_address", selectedClient.direccion || "")
    }
  }

  // Recargar clientes después de agregar uno nuevo
  const handleClientAdded = async () => {
    const clientsData = await ClientService.getClients()
    setClients(clientsData)
    setShowAddClient(false)
  }

  // Actualizar precio unitario cuando se selecciona un producto
  const watchItems = form.watch("items")
  const watchApplyTax = form.watch("apply_tax")

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (product) {
      form.setValue(`items.${index}.unit_price`, product.sale_price)
    }
  }

  // Calcular subtotal
  const calculateSubtotal = () => {
    return watchItems.reduce((total, item) => {
      return total + item.quantity * item.unit_price
    }, 0)
  }

  // Calcular impuesto (ITBIS 18%)
  const calculateTax = () => {
    return watchApplyTax ? calculateSubtotal() * 0.18 : 0
  }

  // Calcular total
  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax()
  }

  // Actualizar el inventario después de crear la factura
  const updateInventory = async (items: any[]) => {
    try {
      const { data: inventoryItems } = await supabase
        .from("inventarios")
        .select("*")
        .in(
          "product_id",
          items.map((item) => item.product_id),
        )

      if (!inventoryItems || inventoryItems.length === 0) return

      for (const item of items) {
        const inventoryItem = inventoryItems.find((inv) => inv.product_id === item.product_id)
        if (inventoryItem) {
          await inventoryService.registerMovement({
            inventario_id: inventoryItem.id,
            tipo: "Salida",
            cantidad: item.quantity,
            usuario: "Sistema",
            comentarios: "Venta automática por facturación",
          })
        }
      }
    } catch (error) {
      console.error("Error al actualizar inventario:", error)
      toast({
        title: "Advertencia",
        description: "La factura se creó correctamente, pero hubo un problema al actualizar el inventario",
        variant: "destructive",
      })
    }
  }

  async function onSubmit(values: FormValues) {
    setIsLoading(true)

    try {
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`
      const subtotal = calculateSubtotal()
      const taxAmount = calculateTax()
      const totalAmount = calculateTotal()

      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert([
          {
            invoice_number: invoiceNumber,
            customer_name: values.customer_name,
            customer_rnc: values.customer_rnc || null,
            customer_phone: values.customer_phone || null,
            customer_address: values.customer_address || null,
            payment_method: values.payment_method,
            payment_status: values.payment_status,
            delivery_date: values.delivery_date,
            notes: values.notes,
            subtotal: subtotal,
            tax_amount: taxAmount,
            total_amount: totalAmount,
            apply_tax: values.apply_tax,
          },
        ])
        .select()
        .single()

      if (invoiceError) throw invoiceError

      const invoiceItems = values.items.map((item) => ({
        invoice_id: invoice.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.quantity * item.unit_price,
      }))

      const { error: itemsError } = await supabase.from("invoice_items").insert(invoiceItems)
      if (itemsError) throw itemsError

      await updateInventory(invoiceItems)

      toast({
        title: "Factura creada",
        description: "La factura ha sido creada exitosamente",
      })

      form.reset()
      onOpenChange(false)
      router.push(`/invoices/${invoice.id}`)
    } catch (error) {
      console.error("Error al crear factura:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al crear la factura",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Factura</DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Sección de Cliente */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Información del Cliente</h3>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <FormField
                        control={form.control}
                        name="selected_client_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Seleccionar Cliente</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value)
                                handleClientSelect(value)
                              }}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Buscar cliente existente..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="new">
                                  <div className="flex items-center">
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Agregar nuevo cliente
                                  </div>
                                </SelectItem>
                                {clients.map((client) => (
                                  <SelectItem key={client.id} value={client.id}>
                                    <div>
                                      <div className="font-medium">{client.nombre}</div>
                                      <div className="text-sm text-gray-500">{client.telefono}</div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="customer_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del Cliente *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ingrese el nombre del cliente" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customer_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono</FormLabel>
                          <FormControl>
                            <Input placeholder="Teléfono del cliente" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customer_rnc"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>RNC/Cédula</FormLabel>
                          <FormControl>
                            <Input placeholder="RNC o cédula del cliente" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customer_address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dirección</FormLabel>
                          <FormControl>
                            <Input placeholder="Dirección del cliente" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Sección de Factura */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Detalles de la Factura</h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="payment_method"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Método de Pago</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione un método de pago" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Efectivo">Efectivo</SelectItem>
                              <SelectItem value="Tarjeta de Crédito">Tarjeta de Crédito</SelectItem>
                              <SelectItem value="Transferencia Bancaria">Transferencia Bancaria</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="payment_status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado del Pago</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione un estado" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Pagado">Pagado</SelectItem>
                              <SelectItem value="Pendiente">Pendiente</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="delivery_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Fecha de Entrega</FormLabel>
                          {isMobile ? (
                            <FormControl>
                              <Input
                                type="date"
                                value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                                onChange={(e) => {
                                  const date = e.target.value ? new Date(e.target.value) : undefined
                                  field.onChange(date)
                                }}
                                min={format(new Date(), "yyyy-MM-dd")}
                              />
                            </FormControl>
                          ) : (
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={`w-full pl-3 text-left font-normal ${
                                      !field.value ? "text-muted-foreground" : ""
                                    }`}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP", { locale: es })
                                    ) : (
                                      <span>Seleccione una fecha</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) => date < new Date()}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="apply_tax"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Aplicar ITBIS (18%)</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              {field.value ? "Se aplicará el ITBIS a esta factura" : "No se aplicará el ITBIS"}
                            </div>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Ingrese notas adicionales" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Sección de Productos */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-lg font-medium">Productos</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({ product_id: "", quantity: 1, unit_price: 0 })}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Producto
                    </Button>
                  </div>

                  {fields.map((field, index) => (
                    <div key={field.id} className="space-y-4 rounded-lg border p-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="sm:col-span-2">
                          <FormField
                            control={form.control}
                            name={`items.${index}.product_id`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Producto</FormLabel>
                                <Select
                                  onValueChange={(value) => {
                                    field.onChange(value)
                                    handleProductChange(index, value)
                                  }}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccione un producto" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {products.map((product) => (
                                      <SelectItem key={product.id} value={product.id}>
                                        {product.name} - {formatCurrency(product.sale_price)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cantidad</FormLabel>
                              <FormControl>
                                <div className="flex items-center">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-10 w-10 rounded-r-none"
                                    onClick={() => {
                                      const newValue = Math.max(1, field.value - 1)
                                      form.setValue(`items.${index}.quantity`, newValue)
                                    }}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <Input type="number" min="1" className="h-10 rounded-none text-center" {...field} />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-10 w-10 rounded-l-none"
                                    onClick={() => {
                                      const newValue = field.value + 1
                                      form.setValue(`items.${index}.quantity`, newValue)
                                    }}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`items.${index}.unit_price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Precio Unitario</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" placeholder="0.00" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Subtotal:{" "}
                          {formatCurrency(
                            form.watch(`items.${index}.quantity`) * form.watch(`items.${index}.unit_price`),
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={fields.length === 1}
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-end">
                    <div className="w-full max-w-xs space-y-2 rounded-lg bg-gray-50 p-4">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(calculateSubtotal())}</span>
                      </div>
                      {watchApplyTax && (
                        <div className="flex justify-between">
                          <span>ITBIS (18%):</span>
                          <span>{formatCurrency(calculateTax())}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold">
                        <span>Total:</span>
                        <span>{formatCurrency(calculateTotal())}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Guardando..." : "Crear Factura"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {showAddClient && <AddClientDialog onClientAdded={handleClientAdded} />}
    </>
  )
}
