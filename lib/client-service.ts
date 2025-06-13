import { supabase } from "./supabase/client"
import type { Cliente } from "../types"

export class ClientService {
  static async getClients(searchTerm?: string, tipoFilter?: string): Promise<Cliente[]> {
    try {
      let query = supabase.from("clientes").select("*").order("created_at", { ascending: false })

      if (searchTerm) {
        query = query.or(`nombre.ilike.%${searchTerm}%,telefono.ilike.%${searchTerm}%`)
      }

      if (tipoFilter && tipoFilter !== "todos") {
        query = query.eq("tipo_cliente", tipoFilter)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error fetching clients:", error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Error in getClients:", error)
      return []
    }
  }

  static async createClient(clientData: Omit<Cliente, "id" | "created_at" | "updated_at">): Promise<Cliente | null> {
    try {
      const { data, error } = await supabase.from("clientes").insert([clientData]).select().single()

      if (error) {
        console.error("Error creating client:", error)
        throw error
      }

      return data
    } catch (error) {
      console.error("Error in createClient:", error)
      return null
    }
  }

  static async updateClient(
    id: string,
    clientData: Partial<Omit<Cliente, "id" | "created_at" | "updated_at">>,
  ): Promise<Cliente | null> {
    try {
      const { data, error } = await supabase
        .from("clientes")
        .update({ ...clientData, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("Error updating client:", error)
        throw error
      }

      return data
    } catch (error) {
      console.error("Error in updateClient:", error)
      return null
    }
  }

  static async deleteClient(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("clientes").delete().eq("id", id)

      if (error) {
        console.error("Error deleting client:", error)
        throw error
      }

      return true
    } catch (error) {
      console.error("Error in deleteClient:", error)
      return false
    }
  }

  static async getClientById(id: string): Promise<Cliente | null> {
    try {
      const { data, error } = await supabase.from("clientes").select("*").eq("id", id).single()

      if (error) {
        console.error("Error fetching client:", error)
        throw error
      }

      return data
    } catch (error) {
      console.error("Error in getClientById:", error)
      return null
    }
  }

  static async getClientStats() {
    try {
      const { data: clients, error } = await supabase.from("clientes").select("tipo_cliente, created_at")

      if (error) {
        console.error("Error fetching client stats:", error)
        throw error
      }

      const total = clients?.length || 0
      const frecuentes = clients?.filter((c) => c.tipo_cliente === "frecuente").length || 0
      const nuevos = clients?.filter((c) => c.tipo_cliente === "nuevo").length || 0

      // Clientes registrados este mes - corregir la lógica
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth()

      const thisMonthClients =
        clients?.filter((c) => {
          const clientDate = new Date(c.created_at)
          return clientDate.getFullYear() === currentYear && clientDate.getMonth() === currentMonth
        }).length || 0

      return {
        total,
        frecuentes,
        nuevos,
        thisMonth: thisMonthClients,
      }
    } catch (error) {
      console.error("Error in getClientStats:", error)
      return {
        total: 0,
        frecuentes: 0,
        nuevos: 0,
        thisMonth: 0,
      }
    }
  }
}
