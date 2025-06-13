import { getSupabaseClient } from "./supabase/client"
import type { InventoryItem, InventoryMovement } from "@/lib/types"

// Define PurchaseOrderItem type here since it's used in other files
export interface PurchaseOrderItem {
  product_id: string
  product_name: string
  cantidad_actual: number
  cantidad_minima: number
  cantidad_maxima: number
  cantidad_a_pedir: number
}

// Servicio para gestionar el inventario
export const inventoryService = {
  // Obtener todos los productos en inventario con sus nombres
  async getInventory(): Promise<InventoryItem[]> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from("inventarios")
      .select(`
        *,
        products:product_id (name)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error al obtener inventario:", error)
      throw error
    }

    return data.map((item) => ({
      ...item,
      product_name: item.products?.name,
    }))
  },

  // Obtener un producto específico del inventario
  async getInventoryItem(id: string): Promise<InventoryItem> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from("inventarios")
      .select(`
        *,
        products:product_id (name)
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error al obtener item de inventario:", error)
      throw error
    }

    return {
      ...data,
      product_name: data.products?.name,
    }
  },

  // Agregar un producto al inventario
  async addInventoryItem(item: Omit<InventoryItem, "id" | "created_at" | "updated_at">): Promise<InventoryItem> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from("inventarios")
      .insert({
        product_id: item.product_id,
        stock_actual: item.stock_actual,
        stock_minimo: item.stock_minimo,
        stock_maximo: item.stock_maximo,
        ubicacion: item.ubicacion,
      })
      .select()
      .single()

    if (error) {
      console.error("Error al agregar item de inventario:", error)
      throw error
    }

    return data
  },

  // FIXED: Agregar un producto al inventario con fecha de entrada (sin duplicar stock)
  async addInventoryItemWithEntry(item: {
    product_id: string
    stock_actual: number
    stock_minimo: number
    stock_maximo: number
    ubicacion: string
    fecha_entrada: string
  }): Promise<InventoryItem> {
    const supabase = getSupabaseClient()

    // Crear el item de inventario con el stock inicial exacto
    const { data: inventoryData, error: inventoryError } = await supabase
      .from("inventarios")
      .insert({
        product_id: item.product_id,
        stock_actual: item.stock_actual, // Stock exacto sin duplicar
        stock_minimo: item.stock_minimo,
        stock_maximo: item.stock_maximo,
        ubicacion: item.ubicacion,
      })
      .select()
      .single()

    if (inventoryError) {
      console.error("Error al agregar item de inventario:", inventoryError)
      throw inventoryError
    }

    // FIXED: Solo registrar movimiento si hay stock inicial, pero NO modificar el stock
    // El movimiento es solo para registro histórico, no para sumar al stock
    if (item.stock_actual > 0) {
      const { error: movementError } = await supabase.from("movimientos_inventario").insert({
        inventario_id: inventoryData.id,
        tipo: "Entrada",
        cantidad: item.stock_actual,
        usuario: "Usuario Actual",
        comentarios: "Stock inicial",
        fecha_entrada: item.fecha_entrada,
      })

      if (movementError) {
        console.error("Error al registrar movimiento inicial:", movementError)
        // No lanzar error aquí para no fallar la creación del inventario
      }
    }

    return inventoryData
  },

  // Actualizar un producto en el inventario
  async updateInventoryItem(id: string, item: Partial<InventoryItem>): Promise<InventoryItem> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from("inventarios")
      .update({
        stock_actual: item.stock_actual,
        stock_minimo: item.stock_minimo,
        stock_maximo: item.stock_maximo,
        ubicacion: item.ubicacion,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error al actualizar item de inventario:", error)
      throw error
    }

    return data
  },

  // FIXED: Registrar un movimiento de inventario (solo para movimientos posteriores)
  async registerMovement(movement: Omit<InventoryMovement, "id" | "created_at">): Promise<void> {
    const supabase = getSupabaseClient()

    // Primero obtenemos el item de inventario actual
    const { data: inventoryItem, error: inventoryError } = await supabase
      .from("inventarios")
      .select("*")
      .eq("id", movement.inventario_id)
      .single()

    if (inventoryError) {
      console.error("Error al obtener item de inventario:", inventoryError)
      throw inventoryError
    }

    // Calculamos el nuevo stock según el tipo de movimiento
    let newStock = inventoryItem.stock_actual
    if (movement.tipo === "Entrada") {
      newStock += movement.cantidad
    } else if (movement.tipo === "Salida" || movement.tipo === "Venta") {
      newStock -= movement.cantidad
    } else if (movement.tipo === "Ajuste") {
      newStock = movement.cantidad
    }

    // Actualizamos el stock
    const { error: updateError } = await supabase
      .from("inventarios")
      .update({
        stock_actual: newStock,
        updated_at: new Date().toISOString(),
      })
      .eq("id", movement.inventario_id)

    if (updateError) {
      console.error("Error al actualizar stock:", updateError)
      throw updateError
    }

    // Registramos el movimiento con fecha de entrada si se proporciona
    const movementData: any = {
      inventario_id: movement.inventario_id,
      tipo: movement.tipo,
      cantidad: movement.cantidad,
      usuario: movement.usuario,
      comentarios: movement.comentarios || "",
    }

    // Solo agregar fecha_entrada para movimientos de entrada y ajuste
    if ((movement.tipo === "Entrada" || movement.tipo === "Ajuste") && movement.fecha_entrada) {
      movementData.fecha_entrada = movement.fecha_entrada
    }

    const { error: movementError } = await supabase.from("movimientos_inventario").insert(movementData)

    if (movementError) {
      console.error("Error al registrar movimiento:", movementError)
      throw movementError
    }
  },

  // Obtener los últimos movimientos de inventario
  async getLatestMovements(limit = 100): Promise<InventoryMovement[]> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from("movimientos_inventario")
      .select(`
        *,
        inventario:inventario_id (
          product_id,
          products:product_id (name)
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error al obtener movimientos:", error)
      throw error
    }

    return data.map((movement) => ({
      ...movement,
      product_name: movement.inventario?.products?.name || "Producto desconocido",
    }))
  },

  // Obtener movimientos por ID de inventario
  async getMovementsByInventoryId(inventoryId: string): Promise<InventoryMovement[]> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from("movimientos_inventario")
      .select(`
        *,
        inventario:inventario_id (
          product_id,
          products:product_id (name)
        )
      `)
      .eq("inventario_id", inventoryId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error al obtener movimientos:", error)
      throw error
    }

    return data.map((movement) => ({
      ...movement,
      product_name: movement.inventario?.products?.name || "Producto desconocido",
    }))
  },

  // Obtener productos con stock bajo
  async getLowStockItems(): Promise<InventoryItem[]> {
    const supabase = getSupabaseClient()

    // Obtenemos todos los productos y filtramos manualmente
    const { data, error } = await supabase.from("inventarios").select(`
        *,
        products:product_id (name)
      `)

    if (error) {
      console.error("Error al obtener items con stock bajo:", error)
      throw error
    }

    // Filtramos manualmente los productos con stock bajo
    const lowStockItems = data.filter((item) => item.stock_actual <= item.stock_minimo)

    return lowStockItems.map((item) => ({
      ...item,
      product_name: item.products?.name,
    }))
  },

  // Generar una orden de compra para productos con stock bajo
  async generatePurchaseOrder(): Promise<PurchaseOrderItem[]> {
    const lowStockItems = await this.getLowStockItems()

    const purchaseOrderItems: PurchaseOrderItem[] = lowStockItems.map((item) => ({
      product_id: item.product_id,
      product_name: item.product_name || "",
      cantidad_actual: item.stock_actual,
      cantidad_minima: item.stock_minimo,
      cantidad_maxima: item.stock_maximo,
      cantidad_a_pedir: item.stock_maximo - item.stock_actual,
    }))

    return purchaseOrderItems
  },

  // Guardar una orden de compra
  async savePurchaseOrder(items: PurchaseOrderItem[]): Promise<string> {
    const supabase = getSupabaseClient()

    // Crear la orden de compra
    const { data: orderData, error: orderError } = await supabase
      .from("ordenes_compra")
      .insert({
        fecha: new Date().toISOString(),
        estado: "Pendiente",
      })
      .select()
      .single()

    if (orderError) {
      console.error("Error al crear orden de compra:", orderError)
      throw orderError
    }

    // Agregar los items a la orden
    const orderItems = items.map((item) => ({
      orden_id: orderData.id,
      product_id: item.product_id,
      cantidad: item.cantidad_a_pedir,
    }))

    const { error: itemsError } = await supabase.from("ordenes_compra_items").insert(orderItems)

    if (itemsError) {
      console.error("Error al agregar items a la orden:", itemsError)
      throw itemsError
    }

    return orderData.id
  },

  // Buscar productos en inventario por nombre
  async searchInventoryByProductName(searchTerm: string): Promise<InventoryItem[]> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from("inventarios")
      .select(`
        *,
        products:product_id (name)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error al buscar en inventario:", error)
      throw error
    }

    // Filtramos manualmente por nombre de producto
    const filteredData = searchTerm
      ? data.filter((item) => item.products?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
      : data

    return filteredData.map((item) => ({
      ...item,
      product_name: item.products?.name,
    }))
  },

  // Eliminar un producto del inventario
  async deleteInventoryItem(id: string): Promise<void> {
    const supabase = getSupabaseClient()

    // Primero verificamos si hay movimientos asociados a este inventario
    const { data: movements, error: movementsError } = await supabase
      .from("movimientos_inventario")
      .select("id")
      .eq("inventario_id", id)

    if (movementsError) {
      console.error("Error al verificar movimientos:", movementsError)
      throw movementsError
    }

    // Si hay movimientos, los eliminamos primero
    if (movements && movements.length > 0) {
      const { error: deleteMovementsError } = await supabase
        .from("movimientos_inventario")
        .delete()
        .eq("inventario_id", id)

      if (deleteMovementsError) {
        console.error("Error al eliminar movimientos:", deleteMovementsError)
        throw deleteMovementsError
      }
    }

    // Ahora eliminamos el inventario
    const { error } = await supabase.from("inventarios").delete().eq("id", id)

    if (error) {
      console.error("Error al eliminar item de inventario:", error)
      throw error
    }
  },
}
