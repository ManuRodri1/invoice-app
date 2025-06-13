export interface InventoryMovement {
  id: string
  inventario_id: string
  tipo: "Entrada" | "Salida" | "Ajuste" | "Venta"
  cantidad: number
  usuario: string
  comentarios?: string
  fecha_entrada?: string // New field for entry date
  created_at: string
  product_name?: string
}

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
  customer_rnc?: string | null
  payment_method: string
  payment_status: string
  delivery_date: string | null
  total_amount: number
  notes: string | null
  created_at: string
  updated_at: string
  subtotal?: number
  tax_amount?: number
  apply_tax?: boolean
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

export type Quote = {
  id: string
  quote_number: string
  customer_name: string
  customer_rnc: string | null
  payment_method: string
  payment_status: string
  delivery_date: string | null
  subtotal: number
  tax_amount: number
  total_amount: number
  apply_tax: boolean
  notes: string | null
  created_at: string
  updated_at: string
  status?: string
}

export type QuoteItem = {
  id: string
  quote_id: string
  product_id: string
  quantity: number
  unit_price: number
  subtotal: number
  created_at: string
  product?: Product
}

export type QuoteWithItems = Quote & {
  items: (QuoteItem & { product: Product })[]
}

// Tipos para el sistema de inventario
export type Inventory = {
  id: string
  product_id: string
  stock_actual: number
  stock_minimo: number
  stock_maximo: number
  ubicacion: string
  created_at: string
  updated_at: string
  product?: Product
}

export interface InventoryItem {
  id: string
  product_id: string
  product_name?: string
  stock_actual: number
  stock_minimo: number
  stock_maximo: number
  ubicacion: string
  created_at: string
  updated_at: string
}

export type PurchaseOrder = {
  id: string
  fecha: string
  estado: string
  created_at: string
  updated_at: string
  items: PurchaseOrderItem[]
}

export interface PurchaseOrderItem {
  product_id: string
  product_name: string
  cantidad_actual: number
  cantidad_minima: number
  cantidad_maxima: number
  cantidad_a_pedir: number
}

// Agregar al final del archivo los nuevos tipos para gastos

export type ExpenseCategory = {
  id: string
  name: string
  budget: number
  color: string
  user_id: string
  created_at: string
  updated_at: string
}

export type Expense = {
  id: string
  category_id: string
  amount: number
  payment_method: string
  description: string | null
  receipt_url: string | null
  date: string
  user_id: string
  created_at: string
  updated_at: string
  category?: ExpenseCategory
}

export type IncomeSource = {
  id: string
  name: string
  type: string
  amount: number
  date: string
  user_id: string
  created_at: string
  updated_at: string
}

export type MonthlyFinancialSummary = {
  month: string
  totalIncome: number
  totalExpenses: number
  balance: number
  expensesByCategory: { [key: string]: number }
  budgetComparison: { [key: string]: { spent: number; budget: number; percentage: number } }
}

// Updated type for inventory movements table display
export interface InventoryMovementDisplay {
  id: string
  product: string
  quantity: number
  investmentCost: number
  entryDate: string
  user: string
}
