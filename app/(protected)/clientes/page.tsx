"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, Filter, Plus } from "lucide-react"
import { AddClientDialog } from "@/components/clients/add-client-dialog"
import { ClientsTable } from "@/components/clients/clients-table"
import { ClientStatsCards } from "@/components/clients/client-stats-cards"
import { ClientService } from "@/lib/client-service"
import { exportToExcel } from "@/lib/excel-exporter"
import { useToast } from "@/hooks/use-toast"
import type { Cliente } from "@/types"

export default function ClientsPage() {
  const [clients, setClients] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [tipoFilter, setTipoFilter] = useState("todos")
  const { toast } = useToast()
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    loadClients()
  }, [searchTerm, tipoFilter])

  const loadClients = async () => {
    try {
      setLoading(true)
      const clientsData = await ClientService.getClients(searchTerm, tipoFilter)
      setClients(clientsData)
    } catch (error) {
      console.error("Error loading clients:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClientAdded = () => {
    loadClients()
    setRefreshTrigger((prev) => prev + 1)
    setAddDialogOpen(false)
  }

  const handleClientUpdated = () => {
    loadClients()
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleExportToExcel = () => {
    if (clients.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay clientes para exportar",
        variant: "destructive",
      })
      return
    }

    const exportData = clients.map((client) => ({
      Nombre: client.nombre,
      Teléfono: client.telefono,
      Correo: client.correo || "",
      Dirección: client.direccion || "",
      Documento: client.documento || "",
      "Tipo de Cliente": client.tipo_cliente,
      "Fecha de Registro": new Date(client.created_at).toLocaleDateString("es-ES"),
    }))

    exportToExcel(exportData, "clientes", "Clientes")

    toast({
      title: "Exportación exitosa",
      description: "Los datos se han exportado a Excel",
    })
  }

  const clearFilters = () => {
    setSearchTerm("")
    setTipoFilter("todos")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">Gestiona la información de tus clientes</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Agregar Cliente
        </Button>
      </div>

      <ClientStatsCards refreshTrigger={refreshTrigger} />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div className="relative flex-1 max-w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por nombre o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Tipo de cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los tipos</SelectItem>
              <SelectItem value="nuevo">Nuevo</SelectItem>
              <SelectItem value="frecuente">Frecuente</SelectItem>
              <SelectItem value="vip">VIP</SelectItem>
              <SelectItem value="corporativo">Corporativo</SelectItem>
            </SelectContent>
          </Select>

          {(searchTerm || tipoFilter !== "todos") && (
            <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto">
              Limpiar filtros
            </Button>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={handleExportToExcel} variant="outline" className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Exportar a Excel
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded mb-4"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded mb-2"></div>
            ))}
          </div>
        </div>
      ) : (
        <ClientsTable clients={clients} onClientUpdated={handleClientUpdated} />
      )}

      <AddClientDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onClientAdded={handleClientAdded} />
    </div>
  )
}
