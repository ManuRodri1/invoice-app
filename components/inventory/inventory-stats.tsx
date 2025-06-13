"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { inventoryService } from "@/lib/inventory-service"
import { Package, AlertTriangle, PackageX } from "lucide-react"
import type { InventoryItem } from "@/lib/types"

interface InventoryStatsProps {
  refreshTrigger?: number
}

export function InventoryStats({ refreshTrigger = 0 }: InventoryStatsProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadInventory = async () => {
      try {
        setLoading(true)
        const data = await inventoryService.getInventory()
        setInventory(data)
        setError(null)
      } catch (err) {
        console.error("Error al cargar inventario:", err)
        setError("No se pudo cargar el inventario")
      } finally {
        setLoading(false)
      }
    }

    loadInventory()
  }, [refreshTrigger])

  // Calcular estadísticas
  const totalProducts = inventory.length
  const lowStockProducts = inventory.filter((item) => item.stock_actual <= item.stock_minimo).length
  const outOfStockProducts = inventory.filter((item) => item.stock_actual === 0).length

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cargando...</CardTitle>
              <CardDescription>Obteniendo datos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return <div className="p-4 bg-red-50 text-red-500 rounded-md">Error: {error}</div>
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <Package className="mr-2 h-4 w-4" />
            Total Productos
          </CardTitle>
          <CardDescription>Productos en inventario</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalProducts}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
            Stock Bajo
          </CardTitle>
          <CardDescription>Productos con stock bajo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-500">{lowStockProducts}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <PackageX className="mr-2 h-4 w-4 text-red-500" />
            Sin Stock
          </CardTitle>
          <CardDescription>Productos sin stock</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-500">{outOfStockProducts}</div>
        </CardContent>
      </Card>
    </div>
  )
}
