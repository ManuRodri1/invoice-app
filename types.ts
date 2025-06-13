export type Product = {
  id: string
  name: string
  description: string | null
  image_url: string | null
  sale_price: number
  cost_price: number
  available: boolean
  created_at: string
  updated_at: string
}

export type Invoice = {
  id: string
  invoice_number: string
  customer_name: string
  payment_method: string
  payment_status: string
  delivery_date: string | null
  total_amount: number
  notes: string | null
  created_at: string
  updated_at: string
}

export type InvoiceItem = {
  id: string
  invoice_id: string
  product_id: string
  quantity: number
  unit_price: number
  subtotal: number
  created_at: string
  product?: Product
}

export type InvoiceWithItems = Invoice & {
  items: (InvoiceItem & { product: Product })[]
}

export type Cliente = {
  id: string
  nombre: string
  telefono: string
  correo: string | null
  direccion: string | null
  documento: string | null
  tipo_cliente: string
  created_at: string
  updated_at: string
}
