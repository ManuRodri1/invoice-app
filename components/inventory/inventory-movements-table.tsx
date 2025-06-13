"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Filter } from "lucide-react"
import type { InventoryMovement } from "@/lib/types"
import { inventoryService } from "@/lib/inventory-service"
import { formatDate } from "@/lib/utils"
import { Pagination } from "@/components/ui/pagination"

interface InventoryMovementsTableProps {
  inventoryId?: string // Opcional para permitir mostrar todos los movimientos
  productName?: string // Opcional para mostrar el nombre del producto
}

export function InventoryMovementsTable({ inventoryId, productName }: InventoryMovementsTableProps) {
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [filteredMovements, setFilteredMovements] = useState<InventoryMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadMovements()
  }, [inventoryId])

  const loadMovements = async () => {
    try {
      setLoading(true)
      let data: InventoryMovement[]

      if (inventoryId) {
        // Cargar movimientos de un producto específico
        data = await inventoryService.getMovementsByInventoryId(inventoryId)
      } else {
        // Cargar todos los movimientos
        data = await inventoryService.getLatestMovements(100) // Limitamos a 100 para evitar problemas de rendimiento
      }

      setMovements(data)
      setFilteredMovements(data)
      setTotalPages(Math.ceil(data.length / itemsPerPage))
    } catch (error) {
      console.error("Error al cargar movimientos:", error)
    } finally {
      setLoading(false)
    }
  }

  // Aplicar filtros
  useEffect(() => {
    let result = movements

    // Filtrar por término de búsqueda (producto o comentario)
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (movement) =>
          movement.product_name?.toLowerCase().includes(term) || movement.comentarios?.toLowerCase().includes(term),
      )
    }

    // Filtrar por tipo de movimiento
    if (typeFilter !== "all") {
      result = result.filter((movement) => movement.tipo === typeFilter)
    }

    setFilteredMovements(result)
    setTotalPages(Math.ceil(result.length / itemsPerPage))
    setCurrentPage(1) // Resetear a la primera página cuando cambian los filtros
  }, [searchTerm, typeFilter, movements])

  // Obtener movimientos para la página actual
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredMovements.slice(startIndex, endIndex)
  }

  const getMovementBadge = (tipo: string) => {
    switch (tipo) {
      case "Entrada":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
            Entrada
          </Badge>
        )
      case "Salida":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
            Salida
          </Badge>
        )
      case "Ajuste":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
            Ajuste
          </Badge>
        )
      case "Venta":
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
            Venta
          </Badge>
        )
      default:
        return <Badge variant="outline">{tipo}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <Card>
      <CardContent className="p-4">
        {/* Título con nombre del producto si está disponible */}
        {productName && (
          <h3 className="text-lg font-medium mb-4">
            Movimientos de: <span className="font-bold">{productName}</span>
          </h3>
        )}

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por producto o comentario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="w-full sm:w-[180px]">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="Entrada">Entradas</SelectItem>
                <SelectItem value="Salida">Salidas</SelectItem>
                <SelectItem value="Ajuste">Ajustes</SelectItem>
                <SelectItem value="Venta">Ventas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabla responsiva */}
        <div className="overflow-x-auto">
          {/* Vista de escritorio */}
          <div className="hidden md:block">
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="py-3 px-4 text-left text-sm font-medium">Fecha</th>
                    <th className="py-3 px-4 text-left text-sm font-medium">Producto</th>
                    <th className="py-3 px-4 text-left text-sm font-medium">Tipo</th>
                    <th className="py-3 px-4 text-center text-sm font-medium">Cantidad</th>
                    <th className="py-3 px-4 text-left text-sm font-medium">Usuario</th>
                    <th className="py-3 px-4 text-left text-sm font-medium">Comentarios</th>
                  </tr>
                </thead>
                <tbody>
                  {getCurrentPageItems().length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-muted-foreground">
                        No se encontraron movimientos
                      </td>
                    </tr>
                  ) : (
                    getCurrentPageItems().map((movement) => (
                      <tr key={movement.id} className="border-b">
                        <td className="py-3 px-4 text-sm">{formatDate(movement.created_at)}</td>
                        <td className="py-3 px-4 text-sm font-medium">{movement.product_name}</td>
                        <td className="py-3 px-4 text-sm">{getMovementBadge(movement.tipo)}</td>
                        <td className="py-3 px-4 text-sm text-center">
                          <span
                            className={
                              movement.tipo === "Entrada"
                                ? "text-green-600"
                                : movement.tipo === "Salida" || movement.tipo === "Venta"
                                  ? "text-red-600"
                                  : ""
                            }
                          >
                            {movement.tipo === "Entrada"
                              ? "+"
                              : movement.tipo === "Salida" || movement.tipo === "Venta"
                                ? "-"
                                : ""}
                            {movement.cantidad}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">{movement.usuario || "Sistema"}</td>
                        <td className="py-3 px-4 text-sm max-w-[200px] truncate">{movement.comentarios || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Vista móvil */}
          <div className="md:hidden space-y-4">
            {getCurrentPageItems().length === 0 ? (
              <div className="py-6 text-center text-muted-foreground">No se encontraron movimientos</div>
            ) : (
              getCurrentPageItems().map((movement) => (
                <Card key={movement.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{movement.product_name}</h3>
                        <p className="text-xs text-muted-foreground">{formatDate(movement.created_at)}</p>
                      </div>
                      {getMovementBadge(movement.tipo)}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Cantidad: </span>
                        <span
                          className={`font-medium ${
                            movement.tipo === "Entrada"
                              ? "text-green-600"
                              : movement.tipo === "Salida" || movement.tipo === "Venta"
                                ? "text-red-600"
                                : ""
                          }`}
                        >
                          {movement.tipo === "Entrada"
                            ? "+"
                            : movement.tipo === "Salida" || movement.tipo === "Venta"
                              ? "-"
                              : ""}
                          {movement.cantidad}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">{movement.usuario || "Sistema"}</div>
                    </div>

                    {movement.comentarios && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Comentarios: </span>
                        {movement.comentarios}
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="mt-4 flex justify-center">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
