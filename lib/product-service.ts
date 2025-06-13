import { supabase } from "./supabase/client"
import type { Product } from "./types"

export async function canDeleteProduct(productId: string): Promise<{ canDelete: boolean; message?: string }> {
  try {
    // Verificar si el producto está siendo utilizado en alguna factura
    const { data: invoiceItems, error } = await supabase
      .from("invoice_items")
      .select("id, invoice:invoices(invoice_number)")
      .eq("product_id", productId)

    if (error) throw error

    // Si el producto está siendo utilizado, devolver false con mensaje
    if (invoiceItems && invoiceItems.length > 0) {
      const invoiceNumbers = [...new Set(invoiceItems.map((item) => item.invoice?.invoice_number).filter(Boolean))]

      return {
        canDelete: false,
        message: `Este producto está siendo utilizado en ${invoiceItems.length} líneas de factura${
          invoiceNumbers.length > 0 ? ` (Facturas: ${invoiceNumbers.join(", ")})` : ""
        }. Elimine primero las facturas relacionadas o actualice las facturas para usar otro producto.`,
      }
    }

    // Si no está siendo utilizado, devolver true
    return { canDelete: true }
  } catch (error) {
    console.error("Error al verificar si se puede eliminar el producto:", error)
    return {
      canDelete: false,
      message: "Ocurrió un error al verificar si el producto puede ser eliminado. Por favor, intenta de nuevo.",
    }
  }
}

// Agregar la función getProducts para obtener todos los productos
export async function getProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase.from("products").select("*").order("name")

    if (error) {
      throw new Error(error.message)
    }

    return data || []
  } catch (error) {
    console.error("Error al obtener productos:", error)
    throw error
  }
}

// Agregar función para obtener un producto por ID
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase.from("products").select("*").eq("id", id).single()

    if (error) {
      throw new Error(error.message)
    }

    return data
  } catch (error) {
    console.error(`Error al obtener producto con ID ${id}:`, error)
    throw error
  }
}
