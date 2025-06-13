"use client"

import { useState, useEffect } from "react"
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
import { CalendarIcon, Minus, Plus, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import type { Quote, QuoteItem, Product } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

const formSchema = z.object({
  customer_name: z.string().min(1, "El nombre del cliente es requerido"),
  customer_rnc: z.string().optional(),
  payment_method: z.string().min(1, "El método de pago es requerido"),
  payment_status: z.string().min(1, "El estado del pago es requerido"),
  delivery_date: z.date().optional(),
  notes: z.string().optional(),
  apply_tax: z.boolean().default(true),
  items: z
    .array(
      z.object({
        id: z.string().optional(),
        product_id: z.string().min(1, "Selecciona un producto"),
        quantity: z.coerce.number().min(1, "La cantidad debe ser al menos 1"),
        unit_price: z.coerce.number().min(0.01, "El precio debe ser mayor a 0"),
      }),
    )
    .min(1, "Agrega al menos un producto"),
})

type FormValues = z.infer<typeof formSchema>

interface EditQuoteDialogProps {
  quote: Quote
  quoteItems: QuoteItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditQuoteDialog({ quote, quoteItems, open, onOpenChange }: EditQuoteDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_name: quote.customer_name,
      customer_rnc: quote.customer_rnc || "",
      payment_method: quote.payment_method,
      payment_status: quote.payment_status,
      delivery_date: quote.delivery_date ? new Date(quote.delivery_date) : undefined,
      notes: quote.notes || "",
      apply_tax: quote.apply_tax,
      items: quoteItems.map((item) => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  // Cargar productos
  useEffect(() => {
    async function loadProducts() {
      const { data } = await supabase.from("products").select("*")
      if (data) setProducts(data)
    }

    loadProducts()
  }, [])

  // Actualizar precio unitario cuando se selecciona un producto
  const watchItems = form.watch("items")
  const watchApplyTax = form.watch("apply_tax")

  // Mejorado: Actualizar precio unitario cuando se selecciona un producto
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

  // Calcular impuesto (ITEBIS 18%)
  const calculateTax = () => {
    return watchApplyTax ? calculateSubtotal() * 0.18 : 0
  }

  // Calcular total
  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax()
  }

  async function onSubmit(values: FormValues) {
    setIsLoading(true)

    try {
      // Calcular subtotal, impuesto y total
      const subtotal = calculateSubtotal()
      const taxAmount = calculateTax()
      const totalAmount = calculateTotal()

      // Actualizar cotización
      const { error: quoteError } = await supabase
        .from("quotes")
        .update({
          customer_name: values.customer_name,
          customer_rnc: values.customer_rnc || null,
          payment_method: values.payment_method,
          payment_status: values.payment_status,
          delivery_date: values.delivery_date,
          notes: values.notes,
          subtotal: subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          apply_tax: values.apply_tax,
          updated_at: new Date().toISOString(),
        })
        .eq("id", quote.id)

      if (quoteError) throw quoteError

      // Eliminar items existentes
      const { error: deleteError } = await supabase.from("quote_items").delete().eq("quote_id", quote.id)

      if (deleteError) throw deleteError

      // Crear nuevos items
      const quoteItems = values.items.map((item) => ({
        quote_id: quote.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.quantity * item.unit_price,
      }))

      const { error: itemsError } = await supabase.from("quote_items").insert(quoteItems)

      if (itemsError) throw itemsError

      toast({
        title: "Cotización actualizada",
        description: "La cotización ha sido actualizada exitosamente",
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Error al actualizar cotización:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar la cotización",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Editar Cotización #{quote.quote_number}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
              <FormField
                control={form.control}
                name="customer_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Nombre del Cliente</FormLabel>
                    <FormControl>
                      <Input placeholder="Ingrese el nombre del cliente" className="text-sm" {...field} />
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
                    <FormLabel className="text-sm">RNC del Cliente</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ingrese el RNC del cliente"
                        className="text-sm"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Método de Pago</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="text-sm">
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
                    <FormLabel className="text-sm">Estado del Pago</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="text-sm">
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
                    <FormLabel className="text-sm">Fecha de Entrega</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={`w-full pl-3 text-left font-normal text-sm ${
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
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="apply_tax"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm lg:col-span-2">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm">Aplicar ITBIS (18%)</FormLabel>
                      <div className="text-xs text-muted-foreground">
                        {field.value ? "Se aplicará el ITBIS a esta cotización" : "No se aplicará el ITBIS"}
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
                  <FormLabel className="text-sm">Notas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ingrese notas adicionales"
                      className="text-sm"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h3 className="text-base sm:text-lg font-medium">Productos</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ product_id: "", quantity: 1, unit_price: 0 })}
                  className="text-sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Producto
                </Button>
              </div>

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-12 sm:gap-2 lg:gap-4 sm:items-end border-b pb-3 sm:border-b-0 sm:pb-0"
                >
                  <div className="sm:col-span-5">
                    <FormField
                      control={form.control}
                      name={`items.${index}.product_id`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={`text-sm ${index !== 0 ? "sm:sr-only" : ""}`}>Producto</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value)
                              handleProductChange(index, value)
                            }}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="text-sm">
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

                  <div className="sm:col-span-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={`text-sm ${index !== 0 ? "sm:sr-only" : ""}`}>Cantidad</FormLabel>
                          <FormControl>
                            <div className="flex items-center">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-r-none"
                                onClick={() => {
                                  const newValue = Math.max(1, field.value - 1)
                                  form.setValue(`items.${index}.quantity`, newValue)
                                }}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                type="number"
                                min="1"
                                className="h-8 rounded-none text-center text-sm"
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-l-none"
                                onClick={() => {
                                  const newValue = field.value + 1
                                  form.setValue(`items.${index}.quantity`, newValue)
                                }}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <FormField
                      control={form.control}
                      name={`items.${index}.unit_price`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={`text-sm ${index !== 0 ? "sm:sr-only" : ""}`}>
                            Precio Unitario
                          </FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" className="text-sm" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <div className="text-right font-medium text-sm">
                      {formatCurrency(form.watch(`items.${index}.quantity`) * form.watch(`items.${index}.unit_price`))}
                    </div>
                  </div>

                  <div className="sm:col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={fields.length === 1}
                      onClick={() => remove(index)}
                      className="w-full sm:w-auto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="flex justify-end pt-4">
                <div className="w-full sm:w-1/2 lg:w-1/3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(calculateSubtotal())}</span>
                  </div>
                  {watchApplyTax && (
                    <div className="flex justify-between text-sm">
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

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? "Guardando..." : "Actualizar Cotización"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
