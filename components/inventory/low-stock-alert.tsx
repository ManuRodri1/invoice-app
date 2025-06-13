"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { inventoryService } from "@/lib/inventory-service"
import { useToast } from "@/components/ui/use-toast"

export function LowStockAlert() {
  const [lowStockCount, setLowStockCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    checkLowStock()
  }, [])

  const checkLowStock = async () => {
    try {
      setLoading(true)
      const lowStockItems = await inventoryService.getLowStockItems()
      setLowStockCount(lowStockItems.length)
    } catch (error) {
      console.error("Error al verificar stock bajo:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateOrder = async () => {
    try {
      setIsGenerating(true)
      const orderItems = await inventoryService.generatePurchaseOrder()

      if (orderItems.length === 0) {
        toast({
          title: "Sin productos",
          description: "No hay productos con stock bajo para generar una orden",
        })
        return
      }

      const orderId = await inventoryService.savePurchaseOrder(orderItems)

      toast({
        title: "Orden generada",
        description: `Se ha generado la orden de compra #${orderId.substring(0, 8)}`,
      })

      // Generar CSV para descargar
      const csvContent =
        "Producto,Stock Actual,Stock Mínimo,Stock Máximo,Cantidad a Pedir\n" +
        orderItems
          .map(
            (item) =>
              `"${item.product_name}",${item.cantidad_actual},${item.cantidad_minima},${item.cantidad_maxima},${item.cantidad_a_pedir}`,
          )
          .join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `orden_compra_${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al generar la orden de compra",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  if (loading || lowStockCount === 0) {
    return null
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>Alerta de Stock Bajo</span>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto border-red-200 text-red-700 hover:bg-red-50"
          onClick={handleGenerateOrder}
          disabled={isGenerating}
        >
          {isGenerating ? "Generando..." : "Generar Orden de Compra"}
        </Button>
      </AlertTitle>
      <AlertDescription>
        Tienes {lowStockCount} producto{lowStockCount !== 1 ? "s" : ""} con poco inventario. Considera hacer un pedido
        para reponer el stock.
      </AlertDescription>
    </Alert>
  )
}
