"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Edit, History, Search, AlertTriangle, Trash2 } from "lucide-react"
import { inventoryService } from "@/lib/inventory-service"
import type { InventoryItem } from "@/lib/types"
import { InventoryAdjustDialog } from "./inventory-adjust-dialog"
import { InventoryMovementsTable } from "./inventory-movements-table"
import { Pagination } from "@/components/ui/pagination"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface InventoryTableProps {
  onInventoryChange?: () => void
}

export function InventoryTable({ onInventoryChange }: InventoryTableProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false)
  const [showMovements, setShowMovements] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null)

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadInventory()
  }, [])

  const loadInventory = async () => {
    try {
      setLoading(true)
      const data = await inventoryService.getInventory()
      setInventory(data)
      setFilteredInventory(data)
      setTotalPages(Math.ceil(data.length / itemsPerPage))
      setError(null)
    } catch (err) {
      console.error("Error al cargar inventario:", err)
      setError("No se pudo cargar el inventario")
    } finally {
      setLoading(false)
    }
  }

  // Filtrar inventario cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm) {
      const filtered = inventory.filter((item) => item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()))
      setFilteredInventory(filtered)
      setTotalPages(Math.ceil(filtered.length / itemsPerPage))
      setCurrentPage(1) // Resetear a la primera página cuando cambia la búsqueda
    } else {
      setFilteredInventory(inventory)
      setTotalPages(Math.ceil(inventory.length / itemsPerPage))
    }
  }, [searchTerm, inventory])

  const handleAdjustClick = (item: InventoryItem) => {
    setSelectedItem(item)
    setIsAdjustDialogOpen(true)
  }

  const handleShowMovements = (item: InventoryItem) => {
    setSelectedItem(item)
    setSelectedItemId(item.id)
    setShowMovements(true)
  }

  const handleAdjustComplete = () => {
    setIsAdjustDialogOpen(false)
    loadInventory()
    if (onInventoryChange) {
      onInventoryChange()
    }
  }

  const handleDeleteClick = (item: InventoryItem) => {
    setItemToDelete(item)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return

    try {
      // Llamar al servicio para eliminar el inventario
      await inventoryService.deleteInventoryItem(itemToDelete.id)

      // Recargar la lista de inventario
      loadInventory()

      // Notificar al componente padre si es necesario
      if (onInventoryChange) {
        onInventoryChange()
      }
    } catch (err) {
      console.error("Error al eliminar item de inventario:", err)
      setError("No se pudo eliminar el item de inventario")
    } finally {
      setIsDeleteDialogOpen(false)
      setItemToDelete(null)
    }
  }

  // Obtener items para la página actual
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredInventory.slice(startIndex, endIndex)
  }

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (error) {
    return <div className="p-4 bg-red-50 text-red-500 rounded-md">Error: {error}</div>
  }

  if (inventory.length === 0) {
    return <div className="text-center p-4">No hay productos en el inventario. Agrega productos para comenzar.</div>
  }

  return (
    <Card>
      <CardContent className="p-4">
        {/* Barra de búsqueda */}
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Tabla responsiva */}
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Vista de escritorio */}
            <div className="hidden md:block">
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="py-3 px-4 text-left text-sm font-medium">Producto</th>
                      <th className="py-3 px-4 text-center text-sm font-medium">Stock Actual</th>
                      <th className="py-3 px-4 text-center text-sm font-medium">Stock Mínimo</th>
                      <th className="py-3 px-4 text-center text-sm font-medium">Stock Máximo</th>
                      <th className="py-3 px-4 text-left text-sm font-medium">Ubicación</th>
                      <th className="py-3 px-4 text-right text-sm font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getCurrentPageItems().length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-muted-foreground">
                          No se encontraron productos
                        </td>
                      </tr>
                    ) : (
                      getCurrentPageItems().map((item) => (
                        <tr key={item.id} className="border-b">
                          <td className="py-3 px-4 text-sm font-medium">{item.product_name}</td>
                          <td className="py-3 px-4 text-sm text-center">
                            <div className="flex items-center justify-center">
                              {item.stock_actual <= item.stock_minimo && (
                                <AlertTriangle className="h-4 w-4 text-amber-500 mr-1" />
                              )}
                              <span className={item.stock_actual <= 0 ? "text-red-500 font-medium" : ""}>
                                {item.stock_actual}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-center">{item.stock_minimo}</td>
                          <td className="py-3 px-4 text-sm text-center">{item.stock_maximo}</td>
                          <td className="py-3 px-4 text-sm">{item.ubicacion || "-"}</td>
                          <td className="py-3 px-4 text-sm text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAdjustClick(item)}
                                className="h-7 px-2 text-xs"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Ajustar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleShowMovements(item)}
                                className="h-7 px-2 text-xs"
                              >
                                <History className="h-3 w-3 mr-1" />
                                Movimientos
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs text-red-500 hover:text-red-700"
                                onClick={() => handleDeleteClick(item)}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Eliminar
                              </Button>
                            </div>
                          </td>
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
                <div className="py-6 text-center text-muted-foreground">No se encontraron productos</div>
              ) : (
                getCurrentPageItems().map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">{item.product_name}</h3>
                          <p className="text-xs text-muted-foreground">{item.ubicacion || "Sin ubicación"}</p>
                        </div>
                        {item.stock_actual <= item.stock_minimo && (
                          <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <div className="text-muted-foreground">Actual</div>
                          <div className={`font-medium ${item.stock_actual <= 0 ? "text-red-500" : ""}`}>
                            {item.stock_actual}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-muted-foreground">Mínimo</div>
                          <div className="font-medium">{item.stock_minimo}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-muted-foreground">Máximo</div>
                          <div className="font-medium">{item.stock_maximo}</div>
                        </div>
                      </div>

                      <div className="flex gap-1 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAdjustClick(item)}
                          className="flex-1 h-8 text-xs"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Ajustar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShowMovements(item)}
                          className="flex-1 h-8 text-xs"
                        >
                          <History className="h-3 w-3 mr-1" />
                          Historial
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 text-xs text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteClick(item)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="mt-4 flex justify-center">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}

        {/* Diálogo de ajuste de inventario */}
        {selectedItem && (
          <InventoryAdjustDialog
            open={isAdjustDialogOpen}
            onOpenChange={setIsAdjustDialogOpen}
            inventoryItem={selectedItem}
            onComplete={handleAdjustComplete}
          />
        )}

        {/* Tabla de movimientos */}
        {showMovements && selectedItem && (
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium">Historial de Movimientos</h3>
              <Button variant="outline" size="sm" onClick={() => setShowMovements(false)}>
                Cerrar
              </Button>
            </div>
            <InventoryMovementsTable inventoryId={selectedItem.id} productName={selectedItem.product_name} />
          </div>
        )}

        {/* Diálogo de confirmación de eliminación */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará permanentemente el inventario del producto "{itemToDelete?.product_name}". Esta
                acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-500 hover:bg-red-700">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
